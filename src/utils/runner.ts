import { fork, ChildProcessWithoutNullStreams } from "child_process";
import { Socket } from "socket.io";

interface RunnerSetOptions {
  command: string;
  args: string[];
  nodeArgs: string[];
}

export class Runner {
  private env!: NodeJS.ProcessEnv;
  private args!: string[];
  private nodeArgs!: string[];
  public command!: string;
  public messages!: string[];
  public child!: ChildProcessWithoutNullStreams;
  public socket!: Socket;

  public constructor() {
    this.env = process.env;

    this.env.FORCE_COLOR = "true";
    this.messages = [];
  }

  setOptions(options?: RunnerSetOptions) {
    if (!options.command) {
      throw new Error("Incorret option, command is required");
    }

    this.command = options.command;
    this.args = options?.args ?? [];
    this.nodeArgs = options?.nodeArgs ?? [];
  }

  exec(callback?: () => void) {
    if (!this.child && this.command) {
      this.child = fork(this.command, this.args, {
        env: this.env,
        silent: true,
        execArgv: this.nodeArgs,
        detached: true,
      });

      this.child.stderr.on("data", (message) => {
        console.log(message.toString("utf-8"));
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

  socketConnected(socket: Socket) {
    this.socket = socket;

    if (this.child || this.messages.length) {
      this.socket.emit("application", this.messages.join(""));
      this.messages = [];
    }
  }
}
