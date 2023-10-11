import * as path from "path";
import { readFileSync } from "fs";

import { Config } from "./config";
import { configSchema } from "./config.schema";
import { ZodError } from "zod";

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
  }
}

function getConfigFolderPath() {
  const windows = process.env.APPDATA;
  if (windows !== undefined) {
    return windows;
  }

  const homePath = process.env.HOME;

  if (homePath === undefined) {
    throw new ConfigError("Cannot determine home");
  }

  const macos = path.join(homePath, "Library", "Preferences");
  const linux = path.join(homePath, ".config");

  return process.platform === "darwin" ? macos : linux;
}

export function loadConfig(): Config {
  const configFilename = path.join(
    getConfigFolderPath(),
    "rclone-tray-sync",
    "config.json",
  );

  try {
    const fileData = readFileSync(configFilename);
    const configString = fileData.toString("utf-8");

    return configSchema.parse(JSON.parse(configString));
  } catch (e) {
    if (e instanceof ZodError || e instanceof Error) {
      throw new ConfigError("Cannot parse config: " + e.message);
    }
    throw e;
  }
}
