import { createFileRoute } from "@tanstack/react-router";
import { BrowserPage } from "@/components/browser/browser-page";

/**
 * The person's own browser, with the ShardsOpenBot Recorder in it.
 *
 * `_authed/_app`, beside Bots, Capabilities and Connections: it is somebody's own, like those, and a browser shown in
 * the page needs the app's full-height pane. Reached from the sidebar's Browser button, which shows only where ShardsOpenBot
 * can run a browser for the person.
 */
export const Route = createFileRoute("/_authed/_app/browser")({
  component: BrowserPage,
});
