import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Reusable nodemailer transporter using Gmail SMTP service.
// NOTE: EMAIL_APP_PASSWORD must be a Gmail App Password generated from Google Account Security settings, NOT the account password.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, text, secret } = body;

    // Validate internal API secret
    const expectedSecret = process.env.INTERNAL_API_SECRET;
    if (!secret || secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing API secret" },
        { status: 401 }
      );
    }

    if (!to || !subject || !text) {
      return NextResponse.json(
        { error: "Bad Request: Missing required email fields (to, subject, text)" },
        { status: 400 }
      );
    }

    // Send email using Nodemailer
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });

    return NextResponse.json({ sent: true }, { status: 200 });
  } catch (error) {
    // Log detailed failure server-side without leaking internal SMTP error details to caller
    console.error("[Nodemailer Error] Failed to send email:", error);
    return NextResponse.json(
      { error: "Internal server error: Failed to send notification email" },
      { status: 500 }
    );
  }
}
