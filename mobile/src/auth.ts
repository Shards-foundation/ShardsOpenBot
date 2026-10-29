import { expoClient } from "@better-auth/expo/client";
import { ssoClient } from "@better-auth/sso/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

const configured = process.env.EXPO_PUBLIC_SERVER_URL;
if (!configured)
  throw new Error(
    "Set EXPO_PUBLIC_SERVER_URL to your ShardsOpenBot deployment before building the native app.",
  );
const endpoint = new URL(configured);
if (
  endpoint.protocol !== "https:" &&
  !(__DEV__ && endpoint.protocol === "http:")
)
  throw new Error("ShardsOpenBot native sign-in requires HTTPS.");
if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash)
  throw new Error(
    "Use the public deployment URL without credentials or query parameters.",
  );
export const serverUrl = endpoint.origin;
export const authClient = createAuthClient({
  baseURL: serverUrl,
  plugins: [
    expoClient({
      scheme: "shardsopenbotmobile",
      storagePrefix: `shardsopenbot-${endpoint.host.replace(/[^a-zA-Z0-9_-]/g, "-")}`,
      storage: SecureStore,
    }),
    ssoClient(),
  ],
});
export async function signIn(provider: "google" | "microsoft" | "okta") {
  const result = await authClient.signIn.social({
    provider: provider as "google",
    callbackURL: "shardsopenbotmobile://",
  });
  if (result.error)
    throw new Error(result.error.message ?? "Could not sign in.");
}
export async function signInEnterprise(email: string) {
  const result = await authClient.signIn.sso({
    email,
    callbackURL: "shardsopenbotmobile://",
  });
  if (result.error)
    throw new Error(
      result.error.message ?? "Could not sign in to your organization.",
    );
}
