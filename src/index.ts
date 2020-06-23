import fs from "fs";
import socket from "socket.io";

import { Runner } from "~/utils/runner";
import { DEFAULT_PORT } from "~/constants";

interface TunnelServerWebpackPluginOptions {
  name: string;
  args?: string[];
  nodeArgs?: string[];
  clearOnRestart?: boolean;
  port?: number;
  signal?: boolean;
  keyboard?: boolean;
}

export default class TunnelServerWebpackPlugin {
  private options!: TunnelServerWebpackPluginOptions;
  private server!: socket.Server;
  private connectedSocket!: socket.Socket;
  private runner!: Runner;
  private entryPoint!: string;

  public constructor(options?: TunnelServerWebpackPluginOptions) {
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

    this.server = socket(this.options.port);

    this.server.on("connection", (socket) => {
      if (this.connectedSocket?.connected) {
        this.connectedSocket?.disconnect();
      }
      this.connectedSocket = socket;
      if (this.options.keyboard) {
        this.addKeyboardListener();
      }
      this.runner.socketConnected(this.connectedSocket);
    });
  }

  private addKeyboardListener = () => {
    this.connectedSocket.on("rs", () => {
      this.start();
    });
  };

  private afterEmit = (compilation, callback) => {
    this.startServer(compilation, callback);
  };

  private watchClose = async () => {
    if (this.server) {
      this.server.close();
    }
    if (this.runner.child) {
      this.runner.child.removeAllListeners();
      this.runner.child.kill();
      this.runner.child = undefined;
    }
  };

  public apply = (compiler) => {
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

  private startServer = (compilation, callback) => {
    const names = Object.keys(compilation.assets);
    if (!compilation.assets[this.options.name]) {
      console.error(
        "Entry " +
          this.options.name +
          " not found. Try one of: " +
          names.join(" ")
      );
    }
    const { existsAt } = compilation.assets[this.options.name];
    this.entryPoint = existsAt;
    fs.chmodSync(this.entryPoint, "777");

    if (!this.runner.command) {
      this.runner.setOptions({
        command: this.entryPoint,
        args: this.options.args,
        nodeArgs: this.options.nodeArgs,
      });
    }

    this.start(() => {
      callback();
    });
  };

  private start = (callback?: () => void) => {
    if (this.runner.child) {
      this.runner.child.kill();
      this.runner.child.removeAllListeners();
      this.runner.child = undefined;

      if (this.options.clearOnRestart) {
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
