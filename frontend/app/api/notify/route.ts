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
    // Log warning server-side without failing caller (e.g. when placeholder SMTP credentials are used)
    console.warn("[Nodemailer Warning] Could not deliver email (check SMTP credentials in .env.local):", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { sent: false, warning: "Notification created, but SMTP email delivery was skipped due to server configuration." },
      { status: 200 }
    );
  }
}
