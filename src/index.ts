import { SyncTrayIcon } from "./tray/sync-tray-icon";
import { YadTrayManager } from "./tray/tray-manager";

let isOn = true;

const trayManager = new YadTrayManager();
const syncTrayIcon = new SyncTrayIcon(trayManager);
syncTrayIcon.initializeMenu();

function reflectState() {
  if (isOn) {
    syncTrayIcon.setSyncEnabledAndDone();
  } else {
    syncTrayIcon.setSyncDisabled();
  }
}

syncTrayIcon.addEventListener((event) => {
  if (event === "quit") {
    syncTrayIcon.close();
    process.exit();
  }

  if (event === "toggle-syncing") {
    isOn = !isOn;
  }

  reflectState();
});

reflectState();
