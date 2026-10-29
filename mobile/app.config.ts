import type { ExpoConfig } from "expo/config";

const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
const config: ExpoConfig = {
  name: "ShardsOpenBot",
  slug: "shardsopenbot",
  version: "0.0.1",
  scheme: "shardsopenbotmobile",
  ios: { bundleIdentifier: "ai.shardsopenbot.mobile", supportsTablet: true },
  android: { package: "ai.shardsopenbot.mobile" },
  plugins: [
    "expo-router",
    "expo-secure-store",
    ["expo-notifications", { defaultChannel: "shardsopenbot" }],
  ],
  extra: { ...(projectId ? { eas: { projectId } } : {}) },
};
export default config;
