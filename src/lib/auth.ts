import { db } from "@/database/mongodb";
import { getResend } from "@/resend/resend";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, twoFactor } from "better-auth/plugins";

const resend = getResend();

export const auth = betterAuth({
  baseURL:
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_URL!
      : process.env.BETTER_AUTH_URL!,
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "rateLimit",
      window: 60,
      max: 10,
      customRules: {
        "/two-factor/*": {
          window: 10,
          max: 5,
        },
        "/two-factor/send-otp": {
          window: 60,
          max: 5,
        },
      },
    },
  },
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
        type: "date", // Add this field
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
      await resend.emails.send({
        from: `SubdiviSync <${process.env.SENDER_EMAIL!}>`,
        to: user.email,
        subject: "Reset your password",
        text: `Click the link to reset your password: ${url}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: `SubdiviSync <${process.env.SENDER_EMAIL!}>`,
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${url}`,
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
          await resend.emails.send({
            from: `SubdiviSync <${process.env.SENDER_EMAIL!}>`,
            to: user.email,
            subject: "2FA Verification",
            text: `Verify your OTP: ${otp}`,
          });
        },
      },
    }),

    nextCookies(),
  ],
});
