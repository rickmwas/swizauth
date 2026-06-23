import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY || "re_dummy_key_for_build";

if (!process.env.RESEND_API_KEY) {
  console.warn("Warning: RESEND_API_KEY environment variable is not defined. Using dummy key for build compilation.");
}

export const resend = new Resend(apiKey);
