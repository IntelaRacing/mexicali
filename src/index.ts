import * as assert from "assert";
import * as Debug from "debug";
import * as path from "path";
import * as ws from "ws";

import { IMexicaliSerialOptions, MexicaliSerial } from "./serial";
const debug = Debug("index");

export interface IMexicaliOptions extends IMexicaliSerialOptions {
  port: number;
}

export interface ISocketError {
  code?: string;
}

const heartbeat = {
  heartbeat: true,
};

const SENSORS_AVAILABLE = {
  a: "engine-temperature",
  b: "latitude",
  c: "longitude",
  d: "speed",
};

export class Mexicali {
  private wss: ws.Server;
  private serial: MexicaliSerial;

  constructor(options: IMexicaliOptions) {
    this.wss = new ws.Server({ port: options.port});
    this.serial = new MexicaliSerial({ serial: options.serial, baudRate: options.baudRate });

    // TODO replace setInterval
    this.wss.on("connection", (socket) => {
      const id = setInterval(() => {
        socket.send(JSON.stringify(heartbeat), (err) => {
          if (err) {
            debug(err);
          }
        });
      }, 1000);

      debug("started client heartbeat ping");

      socket.on("close", () => {
        debug("stopping client heartbeat ping");
        clearInterval(id);
      });

      socket.on("error", (err: ISocketError) => {
        debug(err);
        if (err.code !== "ECONNRESET") {
            throw err;
        }
      });
    });

    // Sample data message: -a+75.20#
    this.serial.parser.on("data", (data: string) => {
      // TODO validate data here
      debug(data);

      try {
        assert(data);
        assert(data.length >= 9);
        assert(data[0] === "-");
        assert(data[2] === "+");
        assert(data[data.length - 2] === "#");
      } catch (err) {
        debug("Invalid input:" + data);
        debug(err);
        return;
      }

      const sensorCode = data[1];
      const sensor = SENSORS_AVAILABLE[sensorCode];
      if (!sensor) {
        debug(`Sensor with identifier: ${sensorCode} unavailable`);
        return;
      }

      const value = data.substring(3, data.length - 2);
      const ts = new Date();
      const hours = ts.getHours();
      const minutes = ts.getMinutes();
      const seconds = ts.getSeconds();

      const reading = {
        sensor,
        ts: hours + " : " + minutes + " : " + seconds,
        value,
      };

      debug(reading);
      this.broadcast(JSON.stringify(reading));
    });
  }

  public broadcast(data: string) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}

// Websocket server with heartbeats
// TODO change port via command line
