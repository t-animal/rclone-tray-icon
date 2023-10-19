import EventEmitter from "eventemitter3";

export type RcloneWrapperState =
  | "syncing-started"
  | "syncing-done"
  | "syncing-aborted"
  | "syncing-error";

export type RcloneWrapperEventConfig = {
  "sync-state-change": RcloneWrapperState;
};
export type RcloneWrapperEvents =
  EventEmitter.EventNames<RcloneWrapperEventConfig>;

export interface RcloneWrapper {
  enableSyncing(): void;

  disableSyncing(): void;

  performSync(): void;

  abortSync(): void;

  addEventListener(
    event: RcloneWrapperEvents,
    handler: (data: RcloneWrapperState) => void,
  ): void;

  removeEventListener(
    event: RcloneWrapperEvents,
    handler: (data: RcloneWrapperState) => void,
  ): void;
}
