import * as assert from "assert";
import * as Debug from "debug";
import * as moment from "moment";
import * as path from "path";
import * as ws from "ws";

import { Reading, SensorConfig } from "./database";
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
  a: "engine_temperature",
  b: "latitude",
  c: "longitude",
  d: "speed",
  e: "suspension",
  f: "gas_pedal",
  g: "brake_pedal",
  h: "sos",
  i: "rpm",
  q: "transmission_temperature",
};

const state = {
  brake_pedal: {
    triggers: [{
      name: "danger",
      value: 0,
      },
      {
        name: "warning",
        value: 10,
      },
    ],
    ts: "N/A",
    type: "inactive",
    value: "N/A",
  },
  engine_temperature: {
    triggers: [{
      name: "danger",
      value: 0,
      },
      {
        name: "warning",
        value: 10,
      },
    ],
    ts: "N/A",
    type: "inactive",
    value: "N/A",
  },
  gas_pedal: {
    triggers: [{
      name: "danger",
      value: 0,
      },
      {
        name: "warning",
        value: 10,
      },
    ],
    ts: "N/A",
    type: "inactive",
    value: "N/A",
  },
  latitude: {
    triggers: [{
      name: "danger",
      value: 0,
      },
      {
        name: "warning",
        value: 10,
      },
    ],
    ts: "N/A",
    type: "inactive",
    value: "N/A",
  },
  longitude: {
    triggers: [{
      name: "danger",
      value: 0,
      },
      {
        name: "warning",
        value: 10,
      },
    ],
    ts: "N/A",
    type: "inactive",
    value: "N/A",
  },
  rpm: {
    triggers: [{
      name: "danger",
      value: 0,
      },
      {
        name: "warning",
        value: 10,
      },
    ],
    ts: "N/A",
    type: "inactive",
    value: "N/A",
  },
  sos: {
    triggers: [{
      name: "danger",
      value: 1,
      },
    ],
    ts: "N/A",
    type: "inactive",
    value: "N/A",
  },
  speed: {
    triggers: [{
      name: "danger",
      value: 0,
      },
      {
        name: "warning",
        value: 10,
      },
    ],
    ts: "N/A",
    type: "inactive",
    value: "N/A",
  },
  suspension: {
    triggers: [{
      name: "danger",
      value: 0,
      },
      {
        name: "warning",
        value: 10,
      },
    ],
    ts: "N/A",
    type: "inactive",
    value: "N/A",
  },
  transmission_temperature: {
    triggers: [{
      name: "danger",
      value: 0,
      },
      {
        name: "warning",
        value: 10,
      },
    ],
    ts: "N/A",
    type: "inactive",
    value: "N/A",
  },
};

export class Mexicali {
  private wss: ws.Server;
  private serial: MexicaliSerial;

  constructor(options: IMexicaliOptions) {
    debug("Initiating Mexicali Websocket Server");
    this.wss = new ws.Server({ port: options.port});
    this.serial = new MexicaliSerial({ serial: options.serial, baudRate: options.baudRate });

    // TODO replace setInterval
    this.wss.on("connection", (socket): void => {
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

      socket.on("error", (err: ISocketError): void => {
        debug(err);
      });
    });

    // Sample data message: -a+75.20#
    this.serial.parser.on("data", (data: string): void => {
      // TODO validate data here
      debug(data);

      try {
        assert(data);
        assert(data.length > 5);
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

      // TODO replace ts with moment
      const value = data.substring(3, data.length - 2);
      const ts =  moment().toDate();
      const hours = ts.getHours();
      const minutes = ts.getMinutes();
      const seconds = ts.getSeconds();

      const reading = {
        triggers: state[SENSORS_AVAILABLE[sensorCode]].triggers,
        ts: hours + " : " + minutes + " : " + seconds,
        type: "active",
        value,
      };

      delete state[SENSORS_AVAILABLE[sensorCode]];
      state[SENSORS_AVAILABLE[sensorCode]] = reading;

      debug(state);
      // Save reading to database
      Reading.create({
        created_at: ts,
        sensor_id: SensorConfig[SENSORS_AVAILABLE[sensorCode]].id,
        value,
       }).then((entry) => {
        debug(`Wrote sensor: ${SensorConfig[SENSORS_AVAILABLE[sensorCode]].name}, value: ${value}`);
      });

      // Send state over websocket
      this.broadcast(JSON.stringify(state));
    });
  }

  public broadcast(data: string): void {
    this.wss.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) {
        client.send(data);
      }
    });
  }
}
