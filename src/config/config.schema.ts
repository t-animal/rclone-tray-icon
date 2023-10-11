// Generated by ts-to-zod
import { z } from "zod";

export const mountSchema = z.object({
  path1: z.string(),
  path2: z.string(),
  syncIntervalInSeconds: z.number(),
});

export const configSchema = z.object({
  rclone: z.string().optional(),
  yad: z.string().optional(),
  mounts: z.array(mountSchema),
});
