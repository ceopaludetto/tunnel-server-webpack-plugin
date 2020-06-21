import io from "socket.io-client";
import { Command } from "commander";

import { version } from "../../package.json";
import { DEFAULT_PORT } from "~/constants";
import { clearConsole } from "~/utils/clear";

const program = new Command("tunnel-server-webpack-plugin");

program
  .version(version)
  .option("-p, --port", "socket server port", DEFAULT_PORT);

program.parse(process.argv);

const socket = io(`http://localhost:${program.port ?? DEFAULT_PORT}`);

socket.on("connect", () => {
  clearConsole();
  console.log("Socket connected succesfully");
});

socket.on("application", (message) => {
  process.stdout.write(message);
});

socket.on("clear", () => {
  clearConsole();
});
