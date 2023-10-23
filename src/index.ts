import { Config } from "./config/config";
import { loadConfig } from "./config/config-parser";
import {
  CompositeRcloneWrapper,
  RcloneSpawningRcloneWrapper,
} from "./rclone-wrapper/rclone-wrapper";
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
    (mount) =>
      new RcloneSpawningRcloneWrapper(
        mount,
        config.rclone ?? "/usr/bin/rclone",
      ),
  );

  const compositeWrapper = new CompositeRcloneWrapper(wrappers);

  function reflectState() {
    console.log("State is ", globalState);
    switch (globalState) {
      case "disabled":
        syncTrayIcon.setSyncDisabled();
        return;
      case "enabled-and-done":
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

  compositeWrapper.addEventListener("sync-state-change", (newState) => {
    console.log("New composite state is", newState);
    switch (newState) {
      case "syncing-started":
        globalState = "syncing";
        break;
      case "syncing-enabled-and-done":
        globalState = "enabled-and-done";
        break;
      case "syncing-paused":
        globalState = "disabled";
        break;
      case "syncing-error":
        globalState = "error";
        break;
      default:
        newState satisfies never;
        throw Error(`Unhandled state ${globalState}`);
    }
    reflectState();
  });

  syncTrayIcon.addEventListener((event) => {
    if (event === "quit") {
      syncTrayIcon.close();
      process.exit();
    }

    if (event === "toggle-syncing") {
      if (globalState === "disabled") {
        return compositeWrapper.enableSyncing();
      } else if (
        globalState === "enabled-and-done" ||
        globalState === "syncing"
      ) {
        return compositeWrapper.disableSyncing();
      }

      globalState satisfies "error";
      reflectState();
    }
  });

  compositeWrapper.enableSyncing();
  reflectState();
}

main();
