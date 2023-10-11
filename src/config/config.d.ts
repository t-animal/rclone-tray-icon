export interface Config {
  /**
   * Path to rclone binary
   * @default /usr/bin/rclone
   */
  rclone?: string;

  /**
   * Path to yad (yet another display) binary
   * @default /usr/bin/yad
   */
  yad?: string;

  mounts: Mount[];
}

export interface Mount {
  /**
   * @pattern .*:.*
   */
  path1: string;

  /**
   * @pattern .*:.*
   */
  path2: string;

  syncIntervalInSeconds: number;
}
