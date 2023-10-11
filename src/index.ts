import { YadTrayManager } from "./tray-icon";

let isOn = true;

const trayManager = new YadTrayManager();
trayManager.setMenu([{ text: "Quit", identifier: "quit" }]);

function reflectState() {
  if (isOn) {
    trayManager.setIcon("assets/sync_done.png").setText("Synchronized");
  } else {
    trayManager.setIcon("assets/sync_off.png").setText("Synchronization off");
  }
}

trayManager.addEventListener("clicked", (event) => {
  if (event.target === "quit") {
    trayManager.close();
    process.exit();
  }

  isOn = !isOn;
  reflectState();
});

reflectState();
