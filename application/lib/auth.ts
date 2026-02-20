import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { organization } from "better-auth/plugins";
import { stripe as stripePlugin } from "@better-auth/stripe";
import Stripe from "stripe";
import { Resend } from "resend";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_BASE_URL || process.env.NEXT_PUBLIC_APP_URL,
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL!,
    process.env.BETTER_AUTH_BASE_URL!,
  ].filter(Boolean),
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: "owner",
      organizationLimit: 1,
      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.id}`;

        // Map role display names - "admin" shows as "Team Leader"
        const roleDisplayName =
          data.role === "admin"
            ? "Team Leader"
            : data.role === "owner"
            ? "Owner"
            : "Member";

        try {
          await resend.emails.send({
            from:
              process.env.RESEND_FROM_EMAIL ||
              "ArcLogs <onboarding@arclogs.com>",
            to: data.email,
            subject: `You've been invited to join ${data.organization.name} on ArcLogs`,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(to right, #4F46E5, #7C3AED); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">ArcLogs</h1>
                  </div>
                  
                  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #111827; margin-top: 0;">You've been invited!</h2>
                    
                    <p style="font-size: 16px; color: #4b5563;">
                      <strong>${
                        data.inviter.user.name || data.inviter.user.email
                      }</strong> has invited you to join 
                      <strong>${
                        data.organization.name
                      }</strong> on ArcLogs as a <strong>${roleDisplayName}</strong>.
                    </p>
                    
                    <p style="font-size: 16px; color: #4b5563;">
                      ArcLogs helps teams replace daily standups with async updates and AI-powered insights.
                    </p>
                    
                    <div style="margin: 32px 0; text-align: center;">
                      <a href="${inviteLink}" 
                         style="background: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                        Accept Invitation
                      </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
                      Or copy and paste this URL into your browser:
                    </p>
                    <p style="font-size: 14px; color: #4F46E5; word-break: break-all;">
                      ${inviteLink}
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                    
                    <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">
                      If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                    <p>© ${new Date().getFullYear()} ArcLogs. All rights reserved.</p>
                  </div>
                </body>
              </html>
            `,
          });
        } catch (error) {
          console.error("Failed to send invitation email:", error);
          throw new Error("Failed to send invitation email");
        }
      },
    }),
    stripePlugin({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: false,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "pro",
            priceId: process.env.STRIPE_PRICE_ID!,
            limits: {
              members: 999,
              teams: 999,
              updates: 999,
            },
          },
        ],
        authorizeReference: async ({ user, referenceId, action }, ctx) => {
          try {
            const member = await ctx.context.adapter.findOne({
              model: "member",
              where: [
                {
                  field: "organizationId",
                  value: referenceId,
                },
                {
                  field: "userId",
                  value: user.id,
                },
              ],
            });

            if (!member) return false;

            const memberRole = (member as any).role as string;

            // Only owners and admins can manage subscriptions
            if (
              action === "upgrade-subscription" ||
              action === "cancel-subscription"
            ) {
              return memberRole === "owner" || memberRole === "admin";
            }

            if (action === "list-subscription") {
              return true;
            }

            return false;
          } catch (error) {
            console.error("Error in authorizeReference:", error);
            return false;
          }
        },
        onSubscriptionComplete: async ({ subscription, plan }) => {
          console.log(
            `Subscription created for ${subscription.referenceId}: ${plan.name}`
          );
        },
        onSubscriptionUpdate: async ({ subscription }) => {
          console.log(`Subscription updated: ${subscription.id}`);
        },
        onSubscriptionCancel: async ({ subscription }) => {
          console.log(`Subscription canceled: ${subscription.id}`);
        },
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
