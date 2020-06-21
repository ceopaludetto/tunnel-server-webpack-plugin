import { spawn } from "child_process";

export class Runner {
  constructor() {
    this.env = process.env;

    this.env.FORCE_COLOR = true;
    this.messages = [];
  }

  setOptions(options = {}) {
    if (!options.command) {
      throw new Error("Incorret option, command is required");
    }

    this.command = options.command;
    this.args = options?.args ?? [];
  }

  exec(callback) {
    if (!this.child && this.command) {
      this.child = spawn("node", [this.command, ...this.args], {
        env: this.env,
        stdio: [null, null, null, null],
        detached: true,
      });

      this.child.stdout.on("data", (message) => {
        if (this.socket) {
          this.socket.emit("application", message.toString("utf-8"));
        } else {
          this.messages.push(message);
        }
      });
    }

    callback();
  }

  socketConnected(socket) {
    this.socket = socket;

    if (this.child || this.messages.length) {
      this.socket.emit("application", this.messages.join(""));
      this.messages = [];
    }
  }
}
