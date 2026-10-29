import {
  RECORDER_SIGNED_OUT,
  type RecorderErrorBody,
} from "@shardsopenbot/shared/recorder-api";

export class ShardsOpenBotError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body: RecorderErrorBody | null,
  ) {
    super(message);
    this.name = "ShardsOpenBotError";
  }

  /** True only for the recorder guard's own 401. */
  get signedOut(): boolean {
    return this.status === 401 && this.body?.code === RECORDER_SIGNED_OUT;
  }
}

type ShardsOpenBotTarget = { shardsopenbotUrl: string; token?: string };

/** Sends the request with the bearer when there is one, never with cookies, and never follows a redirect. */
export async function shardsopenbotRaw(
  target: ShardsOpenBotTarget,
  path: string,
  init: RequestInit,
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (target.token) headers.set("Authorization", `Bearer ${target.token}`);
  const url = new URL(path, target.shardsopenbotUrl);
  if (url.origin !== new URL(target.shardsopenbotUrl).origin) {
    throw new Error(
      `Refusing to send the ShardsOpenBot bearer to ${url.origin}; "${path}" leaves ${new URL(target.shardsopenbotUrl).origin}.`,
    );
  }
  return fetch(url, {
    ...init,
    headers,
    redirect: "error",
    credentials: "omit",
  });
}

async function readErrorBody(
  response: Response,
): Promise<RecorderErrorBody | null> {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      typeof (body as { error?: unknown }).error === "string"
    ) {
      return body as RecorderErrorBody;
    }
  } catch {
    // A body that is not JSON carries no error code.
  }
  return null;
}

/** JSON in, JSON out, bearer when given, `redirect: "error"`, no cookies (`credentials: "omit"`). */
export async function shardsopenbotJson<T>(
  target: ShardsOpenBotTarget,
  path: string,
  init: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  const response = await shardsopenbotRaw(target, path, {
    method: init.method ?? (init.body === undefined ? "GET" : "POST"),
    headers: { ...headers, ...init.headers },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: init.signal,
  });
  if (!response.ok) {
    const body = await readErrorBody(response);
    throw new ShardsOpenBotError(
      response.status,
      body?.error ?? `ShardsOpenBot answered ${response.status}.`,
      body,
    );
  }
  const text = await response.text();
  if (response.status === 204 || text === "") return undefined as T;
  return JSON.parse(text) as T;
}
