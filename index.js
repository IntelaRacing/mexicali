const WebSocket = require('ws');
const path = require('path');

// Websocket server with heartbeats
// TODO change port via command line
// TODO add debug
const wss = new WebSocket.Server({ port: 4000 });
// const serial = require('./serial');

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
});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

// serial.on('data', function (data) {
//   // TODO validate data here
//   console.log(data);
//   wss.broadcast(data);
// });

module.exports = wss;