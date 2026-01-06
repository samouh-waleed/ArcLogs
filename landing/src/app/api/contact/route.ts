import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Fallback to avoid crash if env is missing
const resend = new Resend(process.env.RESEND_API_KEY || 'no_key');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, message } = body ?? {};

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'Arc Logs <onboarding@resend.dev>', // Keep this for testing
      to: ['wabil.arclogs@gmail.com'],           // Ensure this email is verified in Resend
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
      console.error('Resend Error:', error); // Check your terminal for this log
      return NextResponse.json({ error: error.message || 'Email provider error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Server Catch Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}