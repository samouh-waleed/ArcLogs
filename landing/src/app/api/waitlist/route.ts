import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (spreadsheetId) {
      try {
        const sheets = google.sheets({ version: 'v4', auth });

        const existingData = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Sheet1!A:A',
        });

        const existingEmails =
          existingData.data.values
            ?.flat()
            .map((e) => String(e).toLowerCase()) ?? [];

        if (existingEmails.includes(normalizedEmail)) {
          return NextResponse.json(
            { error: 'This email is already on the waitlist!' },
            { status: 409 },
          );
        }

        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Sheet1!A:B',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[normalizedEmail, new Date().toISOString()]],
          },
        });
      } catch {
        // Continue even if sheets fails
      }
    }

    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 },
      );
    }

    const resend = new Resend(resendApiKey);

    try {
      await resend.emails.send({
        from: 'ArcLogs <onboarding@resend.dev>',
        to: normalizedEmail,
        subject: 'Welcome to the ArcLogs Waitlist! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Thanks for Joining the ArcLogs Waitlist!</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #666;">
              We're excited to have you on board! You're now on the list to be among the first
              to experience ArcLogs – the async standup platform that helps distributed teams
              stay aligned without the meetings.
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #666;">
              We'll keep you updated on our progress and let you know as soon as we're ready to launch.
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #666;">
              In the meantime, feel free to reply to this email if you have any questions!
            </p>
            <p style="font-size: 16px; color: #666;">
              Best regards,<br/>
              The ArcLogs Team
            </p>
          </div>
        `,
      });
    } catch {
      return NextResponse.json(
        { error: 'Failed to send confirmation email' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined waitlist',
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 },
    );
  }
}
