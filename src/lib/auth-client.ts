import { createAuthClient } from "better-auth/react";
import { adminClient, twoFactorClient } from "better-auth/client/plugins";
import { admin, ac, tenant } from "@/better-auth/permissions";
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL:
    process.env.NODE_ENV === "production"
      ? (process.env.NEXT_PUBLIC_URL as string)
      : (process.env.BETTER_AUTH_URL as string),
  plugins: [
    twoFactorClient(),
    adminClient({
      ac,
      roles: {
        admin,
        tenant,
      },
    }),
  ],
});

export const { signIn, signUp, useSession, signOut } = createAuthClient();
