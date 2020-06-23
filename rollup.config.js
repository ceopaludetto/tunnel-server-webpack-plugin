import babel from "@rollup/plugin-babel";
import alias from "@rollup/plugin-alias";
import common from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import external from "rollup-plugin-node-externals";
import typescript from "rollup-plugin-typescript2";
import { DEFAULT_EXTENSIONS } from "@babel/core";
import path from "path";

export default [
  {
    input: path.resolve("src", "index.ts"),
    output: [
      {
        file: "dist/index.js",
        format: "cjs",
        exports: "named",
        sourcemap: true,
      },
      {
        file: "dist/index.esm.js",
        format: "esm",
        exports: "named",
        sourcemap: true,
      },
    ],
    plugins: [
      external({ deps: true }),
      resolve({
        mainFields: ["module", "main"].filter(Boolean),
        extensions: [".mjs", ".js", ".jsx", ".json", ".node"],
      }),
      common(),
      typescript({
        tsconfigDefaults: {
          compilerOptions: {
            sourceMap: true,
            declaration: true,
          },
        },
      }),
      babel({
        exclude: /node_modules/,
        extensions: [...DEFAULT_EXTENSIONS, "ts"],
        babelHelpers: "runtime",
      }),
      alias({
        entries: {
          "~": path.resolve("src"),
        },
      }),
      json(),
    ],
  },
  {
    input: path.resolve("src", "bin", "index.ts"),
    output: {
      file: "bin/index.js",
      format: "cjs",
      banner: "#!/usr/bin/env node",
    },
    plugins: [
      external({ deps: true }),
      resolve({
        mainFields: ["module", "main"].filter(Boolean),
        extensions: [".mjs", ".js", ".jsx", ".json", ".node"],
      }),
      common(),
      typescript({
        tsconfigDefaults: {
          compilerOptions: {
            sourceMap: true,
          },
        },
      }),
      babel({
        exclude: /node_modules/,
        extensions: [...DEFAULT_EXTENSIONS, "ts"],
        babelHelpers: "runtime",
      }),
      alias({
        entries: {
          "~": path.resolve("src"),
        },
      }),
      json(),
    ],
  },
];
