const WebSocket = require('ws');
const path = require('path');
const assert = require('assert');

// Websocket server with heartbeats
// TODO change port via command line
// TODO add debug
const wss = new WebSocket.Server({ port: 4000 });
const serial = require('./serial');

const heartbeat = {
  heartbeat: true
};

// TODO replace setInterval
wss.on('connection', (ws) => {
  const id = setInterval(function () {
    ws.send(JSON.stringify(heartbeat), function (err) {
      if (err) {
        console.log(err);
      }
    });
  }, 1000);

  console.log('started client heartbeat ping');

  ws.on('close', function () {
    console.log('stopping client heartbeat ping');
    clearInterval(id);
  });

  ws.on('error', function (err) {
    console.log(err);
    if (err.code !== 'ECONNRESET') {
        throw err
    }
})
});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

const SENSORS_AVAILABLE = {
  a: 'engine-temperature',
  b: 'latitude',
  c: 'longitude',
  d: 'speed'
};


// Sample data message: -a+75.20#
serial.on('data', function (data) {
  // TODO validate data here
  console.log(data);

  try {
    assert(data);
    assert(data.length >= 9);
    assert(data[0] === '-');
    assert(data[2] === '+');
    assert(data[data.length-2] === '#');
  } catch (err) {
    console.log('Invalid input:' + data);
    console.log(err);
    return;
  }

  let sensorCode = data[1];
  let sensor = SENSORS_AVAILABLE[sensorCode];
  if (!sensor) {
    console.log(`Sensor with identifier: ${sensorCode} unavailable`);
    return;
  }

  let value = data.substring(3, data.length - 2);
  let ts = new Date();
  let hours = ts.getHours();
  let minutes = ts.getMinutes();
  let seconds = ts.getSeconds();

  let reading = {
    sensor: sensor,
    value: value,
    ts: hours + ' : ' + minutes + ' : ' + seconds
  };

  console.log(reading);
  wss.broadcast(JSON.stringify(reading));
});

module.exports = wss;