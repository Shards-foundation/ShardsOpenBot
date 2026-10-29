import { describe, expect, test } from "bun:test";
import { desktopTelemetryProperties } from "./desktop-telemetry";

describe("desktop runtime metadata", () => {
  test("leaves ordinary server deployments untagged", () => {
    expect(desktopTelemetryProperties({})).toEqual({});
    expect(
      desktopTelemetryProperties({ SHARDSOPENBOT_DISTRIBUTION: "server" }),
    ).toEqual({});
  });

  test("carries only the shell's bounded metadata", () => {
    expect(
      desktopTelemetryProperties({
        SHARDSOPENBOT_DISTRIBUTION: "desktop",
        SHARDSOPENBOT_VERSION: "0.0.9",
        SHARDSOPENBOT_PLATFORM: "macos",
        SHARDSOPENBOT_ARCH: "aarch64",
        SHARDSOPENBOT_OS_VERSION: "15.6.1",
        SHARDSOPENBOT_ENGINE: "podman",
        OPENAI_API_KEY: "synthetic-secret",
        CPK_TELEMETRY_ID: "identity-belongs-in-the-transport",
        HOME: "/Users/private-name",
        SHARDSOPENBOT_BASE_URL: "https://private.example",
      }),
    ).toEqual({
      shardsopenbot_distribution: "desktop",
      shardsopenbot_version: "0.0.9",
      shardsopenbot_platform: "macos",
      shardsopenbot_arch: "aarch64",
      shardsopenbot_os_version: "15.6.1",
      shardsopenbot_engine: "podman",
    });
  });

  test.each([
    "/Users/private-name",
    "private.example",
    "1.2-private-name",
    "1.2\nsecret",
    "1.2\n",
    "1.2.3.4.5",
    "1".repeat(40),
  ])("rejects arbitrary text in every metadata field: %s", (value) => {
    expect(
      desktopTelemetryProperties({
        SHARDSOPENBOT_DISTRIBUTION: "desktop",
        SHARDSOPENBOT_VERSION: value,
        SHARDSOPENBOT_OS_VERSION: value,
        SHARDSOPENBOT_PLATFORM: value,
        SHARDSOPENBOT_ARCH: value,
        SHARDSOPENBOT_ENGINE: value,
      }),
    ).toEqual({ shardsopenbot_distribution: "desktop" });
  });
});
