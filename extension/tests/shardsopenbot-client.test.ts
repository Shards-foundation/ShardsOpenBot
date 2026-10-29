import { afterAll, beforeAll, expect, test } from "bun:test";
import {
  ShardsOpenBotError,
  shardsopenbotJson,
  shardsopenbotRaw,
} from "../src/shared/shardsopenbot-client";

type Seen = { auth: string | null; cookie: string | null; method: string };
let seen: Seen | null = null;

async function failure(path: string): Promise<ShardsOpenBotError> {
  try {
    await shardsopenbotJson({ shardsopenbotUrl, token: "t" }, path);
  } catch (error) {
    if (error instanceof ShardsOpenBotError) return error;
    throw error;
  }
  throw new Error(`${path} did not fail`);
}
let server: ReturnType<typeof Bun.serve>;
let shardsopenbotUrl = "";

beforeAll(() => {
  server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      const url = new URL(request.url);
      seen = {
        auth: request.headers.get("authorization"),
        cookie: request.headers.get("cookie"),
        method: request.method,
      };
      if (url.pathname === "/ok") {
        return Response.json({
          echoed: request.method === "POST" ? await request.json() : null,
        });
      }
      if (url.pathname === "/signed-out") {
        return Response.json(
          { error: "Sign in again.", code: "RECORDER_SIGNED_OUT" },
          { status: 401 },
        );
      }
      if (url.pathname === "/identity") {
        return Response.json(
          { error: "Identity required.", code: "IDENTITY_REQUIRED" },
          { status: 401 },
        );
      }
      if (url.pathname === "/plain-401") {
        return new Response("nope", { status: 401 });
      }
      if (url.pathname === "/bad") {
        return Response.json({ error: "Bad batch." }, { status: 400 });
      }
      if (url.pathname === "/redirect") {
        return new Response(null, {
          status: 302,
          headers: { location: "/ok" },
        });
      }
      if (url.pathname === "/no-content") {
        return new Response(null, { status: 204 });
      }
      return new Response("missing", { status: 404 });
    },
  });
  shardsopenbotUrl = `http://127.0.0.1:${server.port}`;
});

afterAll(() => {
  server.stop(true);
});

test("sends the bearer, no cookie, and parses JSON", async () => {
  const result = await shardsopenbotJson<{ echoed: unknown }>(
    { shardsopenbotUrl, token: "obr_t" },
    "/ok",
  );
  expect(result).toEqual({ echoed: null });
  expect(seen?.auth).toBe("Bearer obr_t");
  expect(seen?.cookie).toBeNull();
});

test("sends no Authorization header without a token and posts a JSON body", async () => {
  const result = await shardsopenbotJson<{ echoed: unknown }>(
    { shardsopenbotUrl },
    "/ok",
    {
      method: "POST",
      body: { a: 1 },
    },
  );
  expect(result).toEqual({ echoed: { a: 1 } });
  expect(seen?.auth).toBeNull();
  expect(seen?.method).toBe("POST");
});

test("throws ShardsOpenBotError with the status and the server's message on a 4xx", async () => {
  const error = await failure("/bad");
  expect(error).toBeInstanceOf(ShardsOpenBotError);
  expect(error.status).toBe(400);
  expect(error.message).toBe("Bad batch.");
  expect(error.body).toEqual({ error: "Bad batch." });
  expect(error.signedOut).toBe(false);
});

test("signedOut is true only for a 401 carrying RECORDER_SIGNED_OUT", async () => {
  const out = await failure("/signed-out");
  expect(out.status).toBe(401);
  expect(out.signedOut).toBe(true);
  const identity = await failure("/identity");
  expect(identity.status).toBe(401);
  expect(identity.signedOut).toBe(false);
  const plain = await failure("/plain-401");
  expect(plain).toBeInstanceOf(ShardsOpenBotError);
  expect(plain.body).toBeNull();
  expect(plain.signedOut).toBe(false);
});

test("refuses a redirect", async () => {
  await expect(
    shardsopenbotJson({ shardsopenbotUrl, token: "t" }, "/redirect"),
  ).rejects.toThrow();
  await expect(
    shardsopenbotRaw({ shardsopenbotUrl, token: "t" }, "/redirect", {}),
  ).rejects.toThrow();
});

test("shardsopenbotRaw returns the response unparsed and adds the bearer", async () => {
  const response = await shardsopenbotRaw(
    { shardsopenbotUrl, token: "obr_t" },
    "/bad",
    {
      method: "PUT",
    },
  );
  expect(response.status).toBe(400);
  expect(seen?.auth).toBe("Bearer obr_t");
  expect(seen?.method).toBe("PUT");
});

test("a 204 answer with no body resolves to undefined", async () => {
  const result = await shardsopenbotJson<void>(
    { shardsopenbotUrl, token: "obr_t" },
    "/no-content",
    { method: "DELETE" },
  );
  expect(result).toBeUndefined();
  expect(seen?.auth).toBe("Bearer obr_t");
  expect(seen?.method).toBe("DELETE");
});

async function recordFetch(
  run: () => Promise<unknown>,
): Promise<{ inits: RequestInit[]; urls: string[] }> {
  const original = globalThis.fetch;
  const inits: RequestInit[] = [];
  const urls: string[] = [];
  globalThis.fetch = ((
    input: Parameters<typeof fetch>[0],
    init?: RequestInit,
  ) => {
    urls.push(String(input));
    inits.push(init ?? {});
    return original(input, init);
  }) as typeof fetch;
  try {
    await run().catch(() => undefined);
  } finally {
    globalThis.fetch = original;
  }
  return { inits, urls };
}

test("every request goes out with credentials omit and redirect error, whatever the caller passes", async () => {
  const target = { shardsopenbotUrl, token: "obr_t" };
  const { inits } = await recordFetch(async () => {
    await shardsopenbotJson(target, "/ok");
    await shardsopenbotRaw(target, "/ok", {
      credentials: "include",
      redirect: "follow",
    });
  });
  expect(inits).toHaveLength(2);
  for (const init of inits) {
    expect(init.credentials).toBe("omit");
    expect(init.redirect).toBe("error");
  }
});

test("refuses a path that leaves ShardsOpenBot's origin before any request is made", async () => {
  const target = { shardsopenbotUrl, token: "obr_t" };
  for (const path of ["https://evil.test/x", "//evil.test/x"]) {
    let rejected = false;
    const { urls } = await recordFetch(async () => {
      try {
        await shardsopenbotJson(target, path);
      } catch {
        rejected = true;
      }
    });
    expect(rejected).toBe(true);
    expect(urls).toEqual([]);
  }
});

test("shardsopenbotRaw rejects rather than throws when it refuses a path", async () => {
  for (const path of ["https://evil.test/x", "//evil.test/x"]) {
    let rejected = false;
    const { urls } = await recordFetch(async () => {
      const pending = shardsopenbotRaw(
        { shardsopenbotUrl, token: "obr_t" },
        path,
        {},
      );
      await expect(pending).rejects.toThrow();
      rejected = true;
    });
    expect(rejected).toBe(true);
    expect(urls).toEqual([]);
  }
});

test("shardsopenbotRaw rejects rather than throws on an unparseable ShardsOpenBot URL", async () => {
  let rejected = false;
  await recordFetch(async () => {
    const pending = shardsopenbotRaw(
      { shardsopenbotUrl: "not a url" },
      "/x",
      {},
    );
    await expect(pending).rejects.toThrow();
    rejected = true;
  });
  expect(rejected).toBe(true);
});
