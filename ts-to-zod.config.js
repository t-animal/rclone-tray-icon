/**
 * ts-to-zod configuration.
 *
 * @type {import("ts-to-zod").TsToZodConfig}
 */
module.exports = {
  input: "src/config/config.d.ts",
  output: "src/config/config.schema.ts",
};
