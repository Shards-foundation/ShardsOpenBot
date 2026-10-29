// What ShardsOpenBot's own page may ask the Recorder in the same browser (shared/recorder-page.ts): what it is doing, for the
// Browser button's red dot, and Record and Stop from ShardsOpenBot. Answered only for the ShardsOpenBot this copy is connected to,
// by the origin Chrome reports for the page that asked (never anything the page says about itself), and through the
// popup's own Record and Stop, so everything about capture is what it is when the person records from the toolbar.
//
// Any other page is answered as if this copy were connected to nothing, whether it is or not, with the same refusal
// whatever the reason: it learns nothing about the person, which ShardsOpenBot they use, or what they record.
import {
  RECORDER_PAGE_MESSAGES,
  type RecorderPageMessage,
  type RecorderPageResult,
  type RecorderPageState,
} from "@shardsopenbot/shared/recorder-page";
import type { ExternalToBackground, PageResponse } from "../protocol/messages";
import { normaliseShardsOpenBotOrigin } from "../shared/origin";
import { currentConnection } from "./connection";
import { lastStopped } from "./launcher";
import type { LauncherSide } from "./recording";
import type { RouterHandlers } from "./router";

/** What ShardsOpenBot's page drives: the recording controller the popup drives (recording.ts). */
export type ShardsOpenBotPageControls = Pick<RouterHandlers, "page"> &
  Pick<LauncherSide, "current">;

const SENTENCES = {
  notConnected: "Connect this browser to ShardsOpenBot first.",
  ownTab: "Record from ShardsOpenBot's own tab.",
  failed: "The Recorder could not do that. Try again.",
} as const;

const NOT_CONNECTED: RecorderPageState = { connected: false };
const PAGE_TYPES = new Set<string>(Object.values(RECORDER_PAGE_MESSAGES));

const refuse = (error: string): RecorderPageResult => ({ ok: false, error });

export function isShardsOpenBotPageMessage(
  message: ExternalToBackground,
): message is RecorderPageMessage {
  return PAGE_TYPES.has(message.type);
}

/** The page that asked is the connected ShardsOpenBot: its origin, as Chrome reports it, is the stored connection's. A page
 * Chrome gives no origin, or an opaque one (a sandboxed frame's "null"), is not. */
async function fromConnectedShardsOpenBot(
  sender: chrome.runtime.MessageSender,
): Promise<boolean> {
  if (!sender.origin) return false;
  const checked = normaliseShardsOpenBotOrigin(sender.origin);
  if (!checked.ok) return false;
  return (await currentConnection())?.shardsopenbotUrl === checked.origin;
}

/** What the launcher's `state()` reports of the recording (launcher.ts), for the connected ShardsOpenBot. */
async function connectedState(
  controls: ShardsOpenBotPageControls,
): Promise<RecorderPageState> {
  const state = await controls.current();
  const stopped = lastStopped(state);
  return {
    connected: true,
    phase: state.phase,
    ...(state.title ? { title: state.title } : {}),
    ...(state.startedAt !== undefined ? { startedAt: state.startedAt } : {}),
    actions: state.actions,
    ...(stopped ? { lastStopped: stopped } : {}),
  };
}

/** shardsopenbot.state, shardsopenbot.record and shardsopenbot.stop. Every answer resolves; a refusal carries the Recorder's sentence. */
export async function answerShardsOpenBotPage(
  message: RecorderPageMessage,
  sender: chrome.runtime.MessageSender,
  controls: ShardsOpenBotPageControls,
): Promise<RecorderPageState | RecorderPageResult> {
  const connected = await fromConnectedShardsOpenBot(sender);
  if (message.type === RECORDER_PAGE_MESSAGES.state)
    return connected ? connectedState(controls) : NOT_CONNECTED;
  if (!connected) return refuse(SENTENCES.notConnected);
  const answer = async (response: PageResponse): Promise<RecorderPageResult> =>
    response.ok
      ? { ok: true, state: await connectedState(controls) }
      : refuse(response.error);
  try {
    if (message.type === RECORDER_PAGE_MESSAGES.stop)
      return answer(await controls.page({ type: "page.stop" }, {}));
    // The tab ShardsOpenBot is open in, as Chrome reports the sender: a recording starts there and follows every tab the
    // person uses from then on. A frame inside another site's page could name that page's tab, so only ShardsOpenBot's own
    // top frame records.
    const tabId = sender.tab?.id;
    if (tabId === undefined || sender.frameId !== 0)
      return refuse(SENTENCES.ownTab);
    // No language: ShardsOpenBot's page is in ShardsOpenBot's own language, which says nothing of the person's, so the narration
    // takes the browser's, as a Record with no page language of its own does.
    // The person's narration choice as ShardsOpenBot keeps it on their account, as its own Record form passes it on; absent,
    // the choice they made here, and no microphone until they made one.
    return answer(
      await controls.page(
        {
          type: "page.record",
          title: message.title,
          tabId,
          ...(message.narrate !== undefined
            ? { narrate: message.narrate }
            : {}),
        },
        {},
      ),
    );
  } catch (error) {
    console.error("Recorder: ShardsOpenBot's page's request failed", error);
    return refuse(SENTENCES.failed);
  }
}
