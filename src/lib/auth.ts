import { db } from "@/database/mongodb";
import {  sendEmail } from "@/resend/resend";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  baseURL: process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_URL!
    : process.env.BETTER_AUTH_URL!,
  user: {
    additionalFields: {
      address: {
        type: "string",
        required: false,
      },
      gender: {
        type: "string",
        required: false,
      },
      age: {
        type: "number",
        required: false,
      },
      dateOfBirth: {
        type: "date",
        required: false,
      },
      phoneNumber: {
        type: "string",
        required: false,
      },
      status: {
        type: "string",
        required: false,
      },
    },
  },
  database: mongodbAdapter(db),
  trustedOrigins: [
    process.env.NODE_ENV === "production"
      ? (process.env.NEXT_PUBLIC_URL! as string)
      : (process.env.BETTER_AUTH_URL! as string),
    "https://subdivisync11.vercel.app",
  ],
  appName: "SubdiviSync",
  emailAndPassword: {
    requireEmailVerification: true,
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: [{ email: user.email, name: user.name }],
        subject: "Reset your password",
        htmlContent: `<p>Click the link to reset your password: <a href="${url}">${url}</a></p>`,
        textContent: `Click the link to reset your password: ${url}`,
        sender: {
          email: process.env.BREVO_SENDER_EMAIL!,
          name: "SubdiviSync"
        }
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: [{ email: user.email, name: user.name }],
        subject: "Verify your email address",
        htmlContent: `<p>Click the link to verify your email: <a href="${url}">${url}</a></p>`,
        textContent: `Click the link to verify your email: ${url}`,
        sender: {
          email: process.env.BREVO_SENDER_EMAIL!,
          name: "SubdiviSync"
        }
      });
    },
  },
  plugins: [
    adminPlugin({
      adminRoles: ["admin"],
      defaultRole: "tenant",
    }),
    twoFactor({
      skipVerificationOnEnable: true,
      otpOptions: {
        async sendOTP({ user, otp }) {
          await sendEmail({
            to: [{ email: user.email, name: user.name }],
            subject: "2FA Verification",
            htmlContent: `<p>Your verification code is: <strong>${otp}</strong></p>`,
            textContent: `Verify your OTP: ${otp}`,
            sender: {
              email: process.env.BREVO_SENDER_EMAIL!,
              name: "SubdiviSync"
            }
          });
        },
      },
    }),
    nextCookies(),
  ],
});