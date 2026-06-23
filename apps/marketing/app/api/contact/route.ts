import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const { name, email, company, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: "Name, email, and message are required fields" },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    const fromEmail = process.env.MARKETING_FROM_EMAIL || "onboarding@resend.dev";
    const supportEmail = process.env.SUPPORT_EMAIL || "hello@TSAUTH.com";

    // Send an email notifying the support team of the new inquiry
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: supportEmail,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h1 style="color: #4f46e5; font-size: 20px; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">New Contact Message</h1>
          <p style="margin: 8px 0;"><strong>Name:</strong> ${name}</p>
          <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 8px 0;"><strong>Company:</strong> ${company || "Not provided"}</p>
          <div style="margin-top: 16px; padding: 12px; background-color: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; white-space: pre-wrap; color: #334155; line-height: 1.5;">${message}</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 12px;">This is an automated notification from the TSAUTH Marketing site.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Contact submission error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
