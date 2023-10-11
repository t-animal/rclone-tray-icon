import { TrayManagerEvent, TrayManager } from "./tray-manager";

export type TrayIconEvent = "toggle-syncing" | "quit";
export type TrayIconEventHandler = (event: TrayIconEvent) => void;

export class SyncTrayIcon {
  private eventListeners = new Set<TrayIconEventHandler>();

  constructor(private trayManager: TrayManager) {
    trayManager.addEventListener("clicked", (e) =>
      this.handleTrayManagerEvents(e),
    );
  }

  initializeMenu() {
    this.trayManager.setMenu([{ text: "Quit", identifier: "quit" }]);
  }

  addEventListener(handler: TrayIconEventHandler) {
    this.eventListeners.add(handler);
  }

  removeEventListener(handler: TrayIconEventHandler) {
    this.eventListeners.delete(handler);
  }

  close() {
    this.trayManager.close();
  }

  setSyncOngoing() {
    this.trayManager
      .setIcon("assets/sync_ongoing.png")
      .setText("Currently synchronizing");
  }

  setSyncError() {
    this.trayManager
      .setIcon("assets/sync_error.png")
      .setText("Error while syncing");
  }

  setSyncEnabledAndDone() {
    this.trayManager
      .setIcon("assets/sync_done.png")
      .setText("Rclone synchronized");
  }

  setSyncDisabled() {
    this.trayManager
      .setIcon("assets/sync_off.png")
      .setText("Synchronization disabled");
  }

  private handleTrayManagerEvents(event: TrayManagerEvent) {
    if (event.eventName !== "clicked") {
      return;
    }

    if (event.target === undefined) {
      this.eventListeners.forEach((l) => l("toggle-syncing"));
    }

    if (event.target === "quit") {
      this.eventListeners.forEach((l) => l("quit"));
    }
  }
}
