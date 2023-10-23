import EventEmitter from "eventemitter3";
import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";

import { Mount } from "../config/config";
import {
  RcloneWrapper,
  RcloneWrapperEventConfig,
  RcloneWrapperEvents,
  RcloneWrapperState,
} from "./wrapper";

export class CompositeRcloneWrapper implements RcloneWrapper {
  private handledWrappers: Map<RcloneWrapper, RcloneWrapperState> = new Map();
  private eventEmitter = new EventEmitter<RcloneWrapperEventConfig, void>();

  constructor(wrappersToHandle: RcloneWrapper[]) {
    for (const wrapper of wrappersToHandle) {
      this.handledWrappers.set(wrapper, "syncing-enabled-and-done");

      wrapper.addEventListener("sync-state-change", (state) => {
        this.handledWrappers.set(wrapper, state);
        this.eventEmitter.emit(
          "sync-state-change",
          this.determineCompositeState(),
        );
      });
    }
  }

  private determineCompositeState(): RcloneWrapperState {
    const states = Array.from(this.handledWrappers.values());

    const equals = (a: RcloneWrapperState) => (b: RcloneWrapperState) =>
      a === b;

    if (states.some(equals("syncing-started"))) {
      return "syncing-started";
    }
    if (states.some(equals("syncing-error"))) {
      return "syncing-error";
    }
    if (states.some(equals("syncing-paused"))) {
      return "syncing-paused";
    }
    if (states.some(equals("syncing-enabled-and-done"))) {
      return "syncing-enabled-and-done";
    }

    throw Error("Not all states handled when determining composite state");
  }

  enableSyncing = () =>
    Array.from(this.handledWrappers.keys()).forEach((w) => w.enableSyncing());
  disableSyncing = () =>
    Array.from(this.handledWrappers.keys()).forEach((w) => w.disableSyncing());
  performSync = () =>
    Array.from(this.handledWrappers.keys()).forEach((w) => w.performSync());
  abortSync = () =>
    Array.from(this.handledWrappers.keys()).forEach((w) => w.abortSync());

  public addEventListener = (
    event: RcloneWrapperEvents,
    handler: (data: RcloneWrapperState) => void,
  ) => this.eventEmitter.addListener(event, handler);

  public removeEventListener = (
    event: RcloneWrapperEvents,
    handler: (data: RcloneWrapperState) => void,
  ) => this.eventEmitter.removeListener(event, handler);
}

export class RcloneSpawningRcloneWrapper implements RcloneWrapper {
  private eventEmitter = new EventEmitter<RcloneWrapperEventConfig, void>();

  private intervalId: NodeJS.Timeout | null = null;
  private rcloneProcess: ChildProcessWithoutNullStreams;

  constructor(
    public mount: Mount,
    private pathToRclone: string,
  ) {}

  public enableSyncing() {
    console.log("enabling", this.mount);
    this.startInterval();
    this.eventEmitter.emit("sync-state-change", "syncing-enabled-and-done");
  }

  public disableSyncing() {
    this.stopInterval();
    this.abortSync();
    this.eventEmitter.emit("sync-state-change", "syncing-paused");
  }

  public performSync() {
    console.log(`Syncing ${this.mount.path1}<>${this.mount.path2}`);
    this.executeRclone()
      .then(() =>
        this.eventEmitter.emit("sync-state-change", "syncing-started"),
      )
      .catch(() =>
        this.eventEmitter.emit("sync-state-change", "syncing-error"),
      );
  }

  private executeRclone() {
    return new Promise<void>((resolve, reject) => {
      this.rcloneProcess = spawn(this.pathToRclone, [
        "bisync",
        this.mount.path1,
        this.mount.path2,
      ]);
      this.rcloneProcess.on("exit", (code) =>
        code === 0 ? resolve() : reject(code),
      );
    });
  }

  public abortSync() {}

  public addEventListener = (
    event: RcloneWrapperEvents,
    handler: (data: RcloneWrapperState) => void,
  ) => this.eventEmitter.addListener(event, handler);

  public removeEventListener = (
    event: RcloneWrapperEvents,
    handler: (data: RcloneWrapperState) => void,
  ) => this.eventEmitter.removeListener(event, handler);

  private startInterval() {
    this.stopInterval();
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
