const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const SERIAL = process.env.SERIAL
const BAUD = process.env.BAUD || 9600

// TODO get serial and baud from CLI
const port = new SerialPort(SERIAL, { baudRate: Number(BAUD) });
const parser = port.pipe(new Readline({ delimiter: '\n' }));

module.exports = parser;