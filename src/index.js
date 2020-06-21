import fs from "fs";
import socket from "socket.io";

import { Runner } from "~/utils/runner";
import { DEFAULT_PORT } from "~/constants";

export default class WebpackInterfaceStartPlugin {
  constructor(options = {}) {
    if (typeof options === "string") {
      options = { name: options };
    }

    options.args = options?.args ?? [];
    options.nodeArgs = (options?.nodeArgs ?? []).concat(process.execArgv);
    options.clearOnRestart = options?.clearOnRestart ?? true;
    options.port = options?.port ?? DEFAULT_PORT;

    this.options = {
      signal: false,
      keyboard: process.env.NODE_ENV === "development",
      ...options,
    };

    if (this.options.keyboard) {
      this.addKeyboardListener();
    }

    this.server = socket(this.options.port);

    this.server.on("connection", (socket) => {
      this.connectedSocket = socket;
      this.runner.socketConnected(this.connectedSocket);
    });
  }

  addKeyboardListener = () => {
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (data) => {
      if (data.trim() === "rs") {
        this.start();
      }
    });
  };

  afterEmit = (compilation, callback) => {
    this.startServer(compilation, callback);
  };

  watchClose = async () => {
    if (this.server) {
      this.server.close();
    }
    if (this.runner.child) {
      this.runner.child.removeAllListeners();
      this.runner.child.kill();
      this.runner.child = undefined;
    }
  };

  apply = (compiler) => {
    if (compiler.TunnelServerWebpackPlugin) {
      return;
    }

    compiler.TunnelServerWebpackPlugin = this;

    if (!this.runner) {
      this.runner = new Runner();
    }

    if (compiler.hooks) {
      const plugin = { name: "WebpackInterfaceStartServerPlugin" };

      compiler.hooks.afterEmit.tapAsync(plugin, this.afterEmit);
      compiler.hooks.watchClose.tap(plugin, this.watchClose);
    } else {
      compiler.plugin("after-emit", this.afterEmit);
      compiler.plugin("watch-close", this.watchClose);
    }
  };

  startServer = (compilation, callback) => {
    const { options } = this;
    let name;
    const names = Object.keys(compilation.assets);
    if (options.name) {
      name = options.name;
      if (!compilation.assets[name]) {
        console.error(
          "Entry " + name + " not found. Try one of: " + names.join(" ")
        );
      }
    } else {
      name = names[0];
      if (names.length > 1) {
        console.log(
          "More than one entry built, selected " +
            name +
            ". All names: " +
            names.join(" ")
        );
      }
    }
    const { existsAt } = compilation.assets[name];
    this.entryPoint = existsAt;
    fs.chmodSync(this.entryPoint, "777");

    if (!this.runner.command) {
      this.runner.setOptions({
        command: this.entryPoint,
        args: this.options.args,
      });
    }

    this.start(() => {
      callback();
    });
  };

  start = (callback) => {
    if (this.runner.child) {
      this.runner.child.kill();
      this.runner.child.removeAllListeners();
      this.runner.child = undefined;

      if (this.options.clearOnRestart) {
        console.log("clearing");
        this?.connectedSocket?.emit("clear");
        this.runner.messages = [];
      }
    }

    this.runner.exec(() => {
      if (callback) {
        return callback();
      }
      return;
    });
  };
}
