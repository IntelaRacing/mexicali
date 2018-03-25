import * as SerialPort from "serialport";
import { Duplex } from "stream";

export interface IMexicaliSerialOptions {
  serial: string;
  baudRate: number;
}

export class MexicaliSerial {
  public parser: SerialPort.parsers.Readline;
  private port: SerialPort;

  constructor(options: IMexicaliSerialOptions) {
    this.port = new SerialPort(options.serial, { baudRate: options.baudRate });
    this.parser = this.port.pipe(new SerialPort.parsers.Readline({ delimiter: "\n" }));
  }
}
