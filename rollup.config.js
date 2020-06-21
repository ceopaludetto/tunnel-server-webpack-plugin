import babel from "@rollup/plugin-babel";
import alias from "@rollup/plugin-alias";
import common from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import path from "path";

export default [
  {
    input: path.resolve("src", "index.js"),
    output: {
      file: "dist/index.js",
      format: "cjs",
      exports: "named",
    },
    plugins: [
      common(),
      babel(),
      alias({
        entries: {
          "~": path.resolve("src"),
        },
      }),
    ],
  },
  {
    input: path.resolve("src", "bin", "index.js"),
    output: {
      file: "bin/index.js",
      format: "cjs",
      banner: "#!/usr/bin/env node",
    },
    plugins: [
      common(),
      babel(),
      alias({
        entries: {
          "~": path.resolve("src"),
        },
      }),
      json(),
    ],
  },
];
