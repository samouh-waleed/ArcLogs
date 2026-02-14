import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

export async function POST(req: Request) {
  try {
    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { firstName, lastName, email, message } = (body ?? {}) as {
      firstName?: string;
      lastName?: string;
      email?: string;
      message?: string;
    };

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const resend = new Resend(resendApiKey);

    const { error } = await resend.emails.send({
      from: 'Arc Logs <onboarding@resend.dev>',
      to: ['wabil.arclogs@gmail.com'],
      subject: `Arc Logs Contact: ${firstName} ${lastName}`,
      replyTo: email,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap">${message}</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Email provider error' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
