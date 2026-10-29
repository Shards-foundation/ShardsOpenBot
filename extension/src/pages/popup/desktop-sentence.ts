/** Why Connect with ShardsOpenBot Desktop did not connect this browser, one plain sentence per code: ShardsOpenBot Desktop's own
 * error codes, and the Recorder's (no answer, the policy, an address it cannot use, ShardsOpenBot not taking Desktop's code). */
const SENTENCES: Record<string, string> = {
  "origin-not-allowed":
    "ShardsOpenBot Desktop does not recognise this copy of the Recorder. Connect from ShardsOpenBot in your browser instead.",
  "not-installed":
    "ShardsOpenBot Desktop has not set up ShardsOpenBot on this computer yet. Finish setting it up in ShardsOpenBot Desktop, then try again.",
  "not-running":
    "ShardsOpenBot is not running in ShardsOpenBot Desktop. Open ShardsOpenBot Desktop, then try again.",
  "not-signed-in":
    "ShardsOpenBot Desktop is not signed in to your organization. Sign in again in ShardsOpenBot Desktop, then try again.",
  "organization-unavailable":
    "ShardsOpenBot Desktop cannot hand over your organization sign-in right now. Try again later.",
  "handoff-failed":
    "ShardsOpenBot did not give ShardsOpenBot Desktop a code to connect with. Try again.",
  "timed-out": "ShardsOpenBot Desktop did not answer in time. Try again.",
  "no-answer": "ShardsOpenBot Desktop did not answer. Open it, then try again.",
  "host-failed":
    "ShardsOpenBot Desktop ran into a problem while answering. Try again, or connect from ShardsOpenBot in your browser.",
  "unknown-message":
    "This version of ShardsOpenBot Desktop does not understand the Recorder. Update ShardsOpenBot Desktop, then try again.",
  "policy-invalid":
    "Your organization's Recorder policy names an ShardsOpenBot address the Recorder cannot use. Ask your IT team.",
  "pinned-elsewhere":
    "Your organization connects the Recorder to a different ShardsOpenBot. Connect from that ShardsOpenBot instead.",
  "invalid-address":
    "ShardsOpenBot Desktop answered with an address the Recorder cannot use. Connect from ShardsOpenBot in your browser instead.",
  "exchange-refused":
    "ShardsOpenBot did not accept the code ShardsOpenBot Desktop gave the Recorder. Try again.",
  "shardsopenbot-unreachable":
    "ShardsOpenBot did not answer. Make sure ShardsOpenBot is running in ShardsOpenBot Desktop, then try again.",
};

const UNKNOWN =
  "ShardsOpenBot Desktop could not connect this browser. Try again, or connect from ShardsOpenBot in your browser.";

export function desktopSentence(code: string): string {
  return Object.hasOwn(SENTENCES, code) ? (SENTENCES[code] as string) : UNKNOWN;
}
