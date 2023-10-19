import EventEmitter from "eventemitter3";

import { Mount } from "./config/config";

export type RcloneWrapperEventData =
  | "syncing-started"
  | "syncing-done"
  | "syncing-aborted"
  | "syncing-error";

export type RcloneWrapperEventConfig = {
  "sync-state-change": RcloneWrapperEventData;
};
export type RcloneWrapperEvents =
  EventEmitter.EventNames<RcloneWrapperEventConfig>;

export class RcloneWrapper {
  private eventEmitter = new EventEmitter<RcloneWrapperEventConfig, void>();

  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private mount: Mount,
    private pathToRclone: string,
  ) {}

  public enableSyncing() {
    this.startInterval();
  }

  public disableSyncing() {
    this.stopInterval();
    this.abortSync();
  }

  public performSync() {
    console.log(`Syncing ${this.mount.path1}<>${this.mount.path2}`);
    this.eventEmitter.emit("sync-state-change", "syncing-started");
    setTimeout(() => {
      console.log(`Syncing done ${this.mount.path1}<>${this.mount.path2}`);
      this.eventEmitter.emit("sync-state-change", "syncing-done");
    }, 1000);
  }

  public abortSync() {}

  public addEventListener = (
    event: RcloneWrapperEvents,
    handler: (data: RcloneWrapperEventData) => void,
  ) => this.eventEmitter.addListener(event, handler);

  public removeEventListener = (
    event: RcloneWrapperEvents,
    handler: (data: RcloneWrapperEventData) => void,
  ) => this.eventEmitter.removeListener(event, handler);

  private startInterval() {
    this.intervalId = setInterval(
      () => this.performSync(),
      this.mount.syncIntervalInSeconds * 1000,
    );
  }

  private stopInterval() {
    if (this.intervalId === null) {
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
  }
}
