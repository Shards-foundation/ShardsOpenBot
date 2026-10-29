import { describe, expect, test } from "bun:test";
import { testDatabaseUrlFrom } from "./database";

describe("TEST_DATABASE_URL", () => {
  test("requires an explicit test database URL", () => {
    expect(() => testDatabaseUrlFrom({})).toThrow(/TEST_DATABASE_URL/);
  });

  test("refuses the live development database even when DATABASE_URL names it", () => {
    expect(() =>
      testDatabaseUrlFrom({
        TEST_DATABASE_URL:
          "postgres://shardsopenbot:shardsopenbot@localhost:5432/shardsopenbot",
        DATABASE_URL:
          "postgres://shardsopenbot:shardsopenbot@localhost:5432/shardsopenbot_test",
      }),
    ).toThrow(/live shardsopenbot database/);
  });

  test("does not read DATABASE_URL as a fallback", () => {
    expect(() =>
      testDatabaseUrlFrom({
        DATABASE_URL:
          "postgres://shardsopenbot:shardsopenbot@localhost:5432/shardsopenbot_test",
      }),
    ).toThrow(/TEST_DATABASE_URL/);
  });

  test("accepts a dedicated test database", () => {
    expect(
      testDatabaseUrlFrom({
        TEST_DATABASE_URL:
          "postgres://shardsopenbot:shardsopenbot@localhost:5432/shardsopenbot_test",
      }),
    ).toBe(
      "postgres://shardsopenbot:shardsopenbot@localhost:5432/shardsopenbot_test",
    );
  });
});
