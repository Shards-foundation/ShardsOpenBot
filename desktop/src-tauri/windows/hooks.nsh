; ShardsOpenBot Desktop's NSIS installer hooks: bundle.windows.nsis.installerHooks in tauri.conf.json.
; https://v2.tauri.app/distribute/windows-installer/

; Uninstalling takes away what the Recorder host install wrote for this person (src/recorder_install.rs): each
; browser's native messaging host key and the one manifest they all point at, which sits beside the app in
; %LOCALAPPDATA%\ShardsOpenBot. Not on an update, which runs the old uninstaller with /UPDATE; the new version writes them
; again when it starts.
;
; And the person's own browser (src/local_browser.rs): its whole data root, %LOCALAPPDATA%\ShardsOpenBot\local-computer,
; which holds the profile they signed in to by hand. Each of Desktop's folders goes with everything in it (RMDir /r);
; %LOCALAPPDATA%\ShardsOpenBot itself only once nothing else is left in it, since the app may be installed there.
;
; And what registered the Recorder from its stores with Chrome and Edge (src/recorder_external.rs): each store id's
; HKCU Extensions key, with which the browser takes the Recorder it installed back out, and Desktop's note of them.
; There is one DeleteRegKey per store id set in shared/recorder-extension.json, and a test holds the two in step;
; none while the ids are empty.
!macro NSIS_HOOK_POSTUNINSTALL
  ${If} $UpdateMode <> 1
    DeleteRegKey HKCU "Software\Google\Chrome\NativeMessagingHosts\ai.copilotkit.shardsopenbot.recorder"
    DeleteRegKey HKCU "Software\Microsoft\Edge\NativeMessagingHosts\ai.copilotkit.shardsopenbot.recorder"
    DeleteRegKey HKCU "Software\Chromium\NativeMessagingHosts\ai.copilotkit.shardsopenbot.recorder"
    SetShellVarContext current
    Delete "$LOCALAPPDATA\ShardsOpenBot\recorder\ai.copilotkit.shardsopenbot.recorder.json"
    Delete "$LOCALAPPDATA\ShardsOpenBot\recorder\recorder-store-extensions.json"
    RMDir /r "$LOCALAPPDATA\ShardsOpenBot\recorder"
    RMDir /r "$LOCALAPPDATA\ShardsOpenBot\local-computer"
    RMDir "$LOCALAPPDATA\ShardsOpenBot"
  ${EndIf}
!macroend
