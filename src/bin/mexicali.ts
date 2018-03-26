#!/usr/bin/env node

/* tslint:disable:no-console */
import * as program from "commander";
import { Reading, Sensor, SensorConfig } from "../database";
import { IMexicaliOptions, Mexicali } from "../index";

program
  .version("0.9.0")
  .option("-b, --baudRate <n>", "BaudRate (9600)", parseInt)
  .option("-p, --port <n>", "Websocket server port (4000)", parseInt)
  .option("-s, --serial <path>", "Serialport path")
  .option("-d, --databaseInit", "Initialize DB cleanly (WARNING: will wipe DB)")
  .parse(process.argv);

if (!program.serial) {
  console.log("Please supply a serialport path i.e. -s /dev/tty.*");
  process.exit(1);
}

if (program.databaseInit) {
  Sensor.sync({ force: true })
    .then(() => {
      console.log("Building sensor table in DB");

      // TODO fixme
      const sensorArr: any[] = [];

      Object.keys(SensorConfig).forEach((key) => {
        sensorArr.push({
          hash: key,
          id: SensorConfig[key].id,
          name: SensorConfig[key].name,
        });
      });

      return Promise.all(sensorArr.map((sensor) => {
        Sensor.create({ hash: sensor.hash, id: sensor.id, name: sensor.name });
      }));
    })
    .then(() => {
      return Reading.sync({ force: true });
    })
    .catch((err) => {
      console.log(err);
      process.exit(1);
    });
}

const options: IMexicaliOptions = {
  baudRate: program.baudRate || 9600,
  port: program.port || 4000,
  serial: program.serial,
};

console.log(options);

const app = new Mexicali(options);
