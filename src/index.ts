import { Config } from "./config/config";
import { loadConfig } from "./config/config-parser";
import { RcloneWrapper } from "./rclone-wrapper";
import { SyncTrayIcon } from "./tray/sync-tray-icon";
import { YadTrayManager } from "./tray/tray-manager";

type GlobalState = "enabled-and-done" | "disabled" | "syncing" | "error";

function main() {
  let config: Config;
  let globalState: GlobalState = "enabled-and-done";
  try {
    config = loadConfig();
  } catch (e) {
    console.error(`Cannot read configuration: ${(e as Error).message}`);
    process.exit(1);
  }

  const trayManager = new YadTrayManager();
  const syncTrayIcon = new SyncTrayIcon(trayManager);
  syncTrayIcon.initializeMenu();

  const wrappers = config.mounts.map(
    (mount) => new RcloneWrapper(mount, config.rclone ?? "/usr/bin/rclone"),
  );

  function reflectState() {
    console.log("State is ", globalState);
    switch (globalState) {
      case "disabled":
        wrappers.every((w) => w.disableSyncing());
        syncTrayIcon.setSyncDisabled();
        return;
      case "enabled-and-done":
        wrappers.every((w) => w.enableSyncing());
        syncTrayIcon.setSyncEnabledAndDone();
        return;
      case "syncing":
        syncTrayIcon.setSyncOngoing();
        return;
      case "error":
        syncTrayIcon.setSyncError();
        return;
      default:
        globalState satisfies never;
        throw Error(`Unhandled state ${globalState}`);
    }
  }

  wrappers.every((w) =>
    w.addEventListener("syncing-started", () => {
      globalState = "syncing";
      reflectState();
    }),
  );

  wrappers.every((w) =>
    w.addEventListener("syncing-done", () => {
      globalState = "enabled-and-done"; // todo: what if another one is syncing?
      reflectState();
    }),
  );

  wrappers.every((w) =>
    w.addEventListener("syncing-aborted", () => {
      globalState = "enabled-and-done";
      reflectState();
    }),
  );

  wrappers.every((w) =>
    w.addEventListener("syncing-error", () => {
      globalState = "error";
      reflectState();
    }),
  );

  syncTrayIcon.addEventListener((event) => {
    if (event === "quit") {
      syncTrayIcon.close();
      process.exit();
    }

    if (event === "toggle-syncing") {
      if (globalState === "disabled") {
        globalState = "enabled-and-done";
      } else if (globalState === "enabled-and-done") {
        globalState = "disabled";
      }
    }

    reflectState();
  });

  reflectState();
}

main();
