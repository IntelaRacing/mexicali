#!/usr/bin/env node

/* tslint:disable:no-console */
import * as program from "commander";
import { IMexicaliOptions, Mexicali } from "../index";

program
  .version("0.9.0")
  .option("-b, --baudRate <n>", "BaudRate (9600)", parseInt)
  .option("-p, --port <n>", "Websocket server port (4000)", parseInt)
  .option("-s, --serial <path>", "Serialport path")
  .parse(process.argv);

if (!program.serial) {
  console.log("Please supply a serialport path i.e. -s /dev/tty.*");
  process.exit(1);
}

const options: IMexicaliOptions = {
  baudRate: program.baudRate || 9600,
  port: program.port || 4000,
  serial: program.serial,
};

console.log(options);

const app = new Mexicali(options);
