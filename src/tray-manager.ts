import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";

export type TrayEventName = "clicked";
export interface TrayManagerEvent {
  eventName: TrayEventName;
  target?: string;
}

export type TrayEventHandler = (event: TrayManagerEvent) => void;

export type TrayMenu = TrayMenuItem[];
export interface TrayMenuItem {
  text: string;
  identifier: string;
}

export interface TrayManager {
  addEventListener(event: TrayEventName, handler: TrayEventHandler): void;
  removeEventListener(event: TrayEventName, handler: TrayEventHandler): void;

  close(): void;

  setIcon(iconFileName: string): TrayManager;
  setText(text: string): TrayManager;
  setMenu(menu: TrayMenu): TrayManager;
}

export class YadTrayManager implements TrayManager {
  private clickListeners = new Set<TrayEventHandler>();
  private yadProcess: ChildProcessWithoutNullStreams;

  constructor() {
    this.yadProcess = this.spawnYad();
    this.yadProcess.stdout.on("data", (chunk) => this.handleEvent(chunk));
  }

  private spawnYad() {
    return spawn(
      "/usr/bin/yad",
      [
        "--listen",
        "--notification",
        "--image=assets/sync_setup.png",
        "--text=Setting up",
        "--command=echo clicked",
      ],
      {
        cwd: __dirname,
      },
    );
  }

  private handleEvent(data: Buffer) {
    const event = data.toString();

    if (event === "clicked\n") {
      this.clickListeners.forEach((l) => l({ eventName: "clicked" }));
      return;
    }

    if (event.startsWith("clicked-menu")) {
      const menuItemIdentifier = event.substring(
        "clicked-menu".length + 1,
        event.length - 1,
      );
      this.clickListeners.forEach((l) =>
        l({ eventName: "clicked", target: menuItemIdentifier }),
      );
      return;
    }

    console.error(`Unknown event: ${data.toString()}`);
  }

  close() {
    this.yadProcess.kill();
  }

  addEventListener(event: TrayEventName, handler: TrayEventHandler) {
    if (event === "clicked") {
      this.clickListeners.add(handler);
    }
  }

  removeEventListener(event: TrayEventName, handler: TrayEventHandler) {
    if (event === "clicked") {
      this.clickListeners.delete(handler);
    }
  }

  setIcon(iconFileName: string) {
    this.yadProcess.stdin.write(`icon:${iconFileName}\n`);
    return this;
  }

  setText(text: string) {
    this.yadProcess.stdin.write(`tooltip:${text}\n`);
    return this;
  }

  setMenu(menu: TrayMenu) {
    const menuConfig = menu
      .map((item) => `${item.text}!echo "clicked-menu-${item.identifier}"`)
      .join("|");
    this.yadProcess.stdin.write(`menu:${menuConfig}\n`);
    return this;
  }
}
