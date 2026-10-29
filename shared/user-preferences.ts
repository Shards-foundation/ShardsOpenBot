export type MessageListEmphasis = "agent" | "thread";

export type NarrationPreference = "on" | "off";
/**
 * Every skin ShardsOpenBot ships. `shardsopenbot` is the default and is ShardsOpenBot exactly as it is without a
 * skin: no frame of its own, no tokens of its own.
 *
 * Here rather than in the app because the choice is saved on the person's account, so the server
 * has to know which values it may store.
 */
export const SKIN_IDS = [
  "shardsopenbot",
  "openduet",
  "opendots",
  "openmuse",
] as const;

export type SkinId = (typeof SKIN_IDS)[number];

export const DEFAULT_SKIN: SkinId = "shardsopenbot";

export function isSkinId(value: unknown): value is SkinId {
  return SKIN_IDS.some((id) => id === value);
}

export type UserPreferences = {
  /** Set by profile saves so choosing a name finishes the first-run prompt. */
  profileNameSet?: boolean;
  messageListEmphasis: MessageListEmphasis;
  /** Whether this person closed the banner offering help self-hosting ShardsOpenBot. */
  selfHostBannerDismissed: boolean;
  /**
   * Whether this person narrates their recordings in ShardsOpenBot's Browser: the page listens to their microphone (hosted
   * ShardsOpenBot), or the Recorder in their browser does (ShardsOpenBot Desktop), only when it is `on`. Null until they chose, which
   * the Browser page asks before their first recording; the microphone stays closed until then.
   */
  narration: NarrationPreference | null;
  /** How ShardsOpenBot looks for this person, on every device they sign in from. */
  skin: SkinId;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  messageListEmphasis: "thread",
  selfHostBannerDismissed: false,
  narration: null,
  skin: DEFAULT_SKIN,
};
