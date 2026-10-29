/** Only the desktop shell's closed metadata may join the runtime's existing events. */
export function desktopTelemetryProperties(
  env: Record<string, string | undefined> = process.env,
): Record<string, string> {
  if (env.SHARDSOPENBOT_DISTRIBUTION !== "desktop") return {};

  const properties: Record<string, string> = {
    shardsopenbot_distribution: "desktop",
  };
  for (const [input, output, allowed] of [
    [
      "SHARDSOPENBOT_PLATFORM",
      "shardsopenbot_platform",
      ["macos", "windows", "linux", "other"],
    ],
    [
      "SHARDSOPENBOT_ARCH",
      "shardsopenbot_arch",
      ["aarch64", "x86_64", "other"],
    ],
    [
      "SHARDSOPENBOT_ENGINE",
      "shardsopenbot_engine",
      ["docker", "podman", "none"],
    ],
  ] as const) {
    const value = env[input];
    if (value && allowed.some((item) => item === value))
      properties[output] = value;
  }
  for (const [input, output] of [
    ["SHARDSOPENBOT_VERSION", "shardsopenbot_version"],
    ["SHARDSOPENBOT_OS_VERSION", "shardsopenbot_os_version"],
  ] as const) {
    const value = env[input];
    if (
      value &&
      value.length <= 32 &&
      value.trim() === value &&
      /^\d+(?:\.\d+){1,3}$/.test(value)
    ) {
      properties[output] = value;
    }
  }
  return properties;
}
