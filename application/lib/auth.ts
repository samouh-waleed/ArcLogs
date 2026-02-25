import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { organization } from "better-auth/plugins";
import { stripe as stripePlugin } from "@better-auth/stripe";
import Stripe from "stripe";
import { Resend } from "resend";
import { eq, and, isNull, inArray } from "drizzle-orm";
import {
  member as memberTable,
  subscription as subscriptionTable,
  user as userTable,
} from "@/drizzle/schema";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "ArcLogs <onboarding@arclogs.com>";

/** Finds the org owner's email for transactional emails. */
async function getOrgOwnerEmail(
  organizationId: string
): Promise<{ email: string; name: string } | null> {
  const ownerMembership = await db.query.member.findFirst({
    where: and(
      eq(memberTable.organizationId, organizationId),
      eq(memberTable.role, "owner"),
      isNull(memberTable.deletedAt)
    ),
  });
  if (!ownerMembership) return null;

  const owner = await db.query.user.findFirst({
    where: eq(userTable.id, ownerMembership.userId),
  });
  if (!owner?.email) return null;

  return { email: owner.email, name: owner.name };
}

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
      // Returns true to BLOCK org creation (limit reached), false to ALLOW.
      // Free/Pro: max 1 org. Enterprise: max 5 orgs.
      // "Enterprise" is detected by checking if ANY of the user's current orgs
      // holds an active/trialing enterprise subscription.
      organizationLimit: async (user) => {
        // Note: db.query uses the schema export name ("member", "subscription"),
        // while the column references use the aliased imports (memberTable, subscriptionTable).
        const memberships = await db.query.member.findMany({
          where: and(
            eq(memberTable.userId, user.id),
            isNull(memberTable.deletedAt)
          ),
        });

        const orgIds = memberships.map((m) => m.organizationId);
        const currentCount = orgIds.length;

        if (currentCount === 0) return false; // always allow first org

        // Pro and Enterprise users can have up to 5 orgs.
        // Free users are limited to 1.
        const paidSub = await db.query.subscription.findFirst({
          where: and(
            inArray(subscriptionTable.referenceId, orgIds),
            inArray(subscriptionTable.status, ["active", "trialing"]),
            inArray(subscriptionTable.plan, ["pro", "enterprise"])
          ),
        });

        const maxOrgs = paidSub ? 5 : 1;
        return currentCount >= maxOrgs;
      },
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
            priceId: process.env.STRIPE_PRO_PRICE_ID!,
          },
          // Only register enterprise plan when a Stripe price ID is configured
          ...(process.env.STRIPE_ENTERPRISE_PRICE_ID
            ? [
                {
                  name: "enterprise",
                  priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
                },
              ]
            : []),
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
        onSubscriptionComplete: async ({ subscription: sub, plan }) => {
          const planLabel =
            plan.name.charAt(0).toUpperCase() + plan.name.slice(1);
          console.log(
            `✅ [Stripe] Subscription created: org=${sub.referenceId} plan=${plan.name}`
          );

          try {
            const owner = await getOrgOwnerEmail(sub.referenceId);
            if (!owner) return;

            const voiceFeature =
              plan.name === "pro" || plan.name === "enterprise";
            const jiraFeature =
              plan.name === "pro" || plan.name === "enterprise";
            const teamLimit =
              plan.name === "enterprise" ? "Unlimited" : "Unlimited";
            const memberLimit =
              plan.name === "enterprise" ? "Unlimited" : "50";

            await resend.emails.send({
              from: FROM_EMAIL,
              to: owner.email,
              subject: `You're now on ${planLabel} — here's what's unlocked`,
              html: `
                <!DOCTYPE html>
                <html>
                  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(to right, #4F46E5, #7C3AED); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 28px;">ArcLogs</h1>
                    </div>
                    <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                      <h2 style="color: #111827; margin-top: 0;">Welcome to ${planLabel}, ${owner.name}!</h2>
                      <p style="font-size: 16px; color: #4b5563;">
                        Your subscription is now active. Here's everything that's unlocked for your organization:
                      </p>
                      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr><td style="padding: 8px 0; color: #4b5563;">✅ Teams</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${teamLimit}</td></tr>
                          <tr><td style="padding: 8px 0; color: #4b5563;">✅ Team members</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">Up to ${memberLimit}</td></tr>
                          <tr><td style="padding: 8px 0; color: #4b5563;">${voiceFeature ? "✅" : "—"} Voice standups (Whisper AI)</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${voiceFeature ? "Enabled" : "Not included"}</td></tr>
                          <tr><td style="padding: 8px 0; color: #4b5563;">${jiraFeature ? "✅" : "—"} Jira automation</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${jiraFeature ? "Enabled" : "Not included"}</td></tr>
                          <tr><td style="padding: 8px 0; color: #4b5563;">✅ Standup history</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">Unlimited</td></tr>
                        </table>
                      </div>
                      <p style="font-size: 14px; color: #6b7280;">
                        If you have any questions or need help getting started, reply to this email and we'll get back to you.
                      </p>
                      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                      <p style="font-size: 12px; color: #9ca3af; margin: 0;">© ${new Date().getFullYear()} ArcLogs. All rights reserved.</p>
                    </div>
                  </body>
                </html>
              `,
            });
          } catch (err) {
            console.error("[Stripe] Failed to send upgrade email:", err);
          }
        },

        onSubscriptionUpdate: async ({ subscription: sub }) => {
          console.log(
            `🔄 [Stripe] Subscription updated: id=${sub.id} org=${sub.referenceId} status=${sub.status} plan=${sub.plan}`
          );
        },

        onSubscriptionCancel: async ({ subscription: sub }) => {
          const planLabel = sub.plan
            ? sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)
            : "Pro";
          console.log(
            `❌ [Stripe] Subscription canceled: org=${sub.referenceId} plan=${sub.plan}`
          );

          try {
            const owner = await getOrgOwnerEmail(sub.referenceId);
            if (!owner) return;

            await resend.emails.send({
              from: FROM_EMAIL,
              to: owner.email,
              subject: "Your ArcLogs subscription has ended",
              html: `
                <!DOCTYPE html>
                <html>
                  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(to right, #4F46E5, #7C3AED); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 28px;">ArcLogs</h1>
                    </div>
                    <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                      <h2 style="color: #111827; margin-top: 0;">Your ${planLabel} subscription has ended</h2>
                      <p style="font-size: 16px; color: #4b5563;">
                        Hi ${owner.name}, your ArcLogs ${planLabel} subscription has been canceled. Your organization is now on the Free plan.
                      </p>
                      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <p style="margin: 0; font-weight: 600; color: #991b1b;">What changes on the Free plan:</p>
                        <ul style="margin: 12px 0 0; padding-left: 20px; color: #4b5563;">
                          <li>Limited to 1 team and 5 members</li>
                          <li>Voice standups are disabled</li>
                          <li>Jira automation is disabled</li>
                          <li>Text standups and AI analysis continue to work</li>
                        </ul>
                      </div>
                      <p style="font-size: 16px; color: #4b5563;">
                        Your standup history is preserved. Resubscribe any time to restore full access.
                      </p>
                      <div style="margin: 32px 0; text-align: center;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing"
                           style="background: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                          Resubscribe
                        </a>
                      </div>
                      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                      <p style="font-size: 12px; color: #9ca3af; margin: 0;">© ${new Date().getFullYear()} ArcLogs. All rights reserved.</p>
                    </div>
                  </body>
                </html>
              `,
            });
          } catch (err) {
            console.error("[Stripe] Failed to send cancellation email:", err);
          }
        },
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
