#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../app');
var debug = require('debug')('iotserver:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

// Connect Mongo DB 
var mongoDB = require("mongodb").MongoClient;
var url = "mongodb://127.0.0.1:27017/IoTDB";
var dbObj = null;
mongoDB.connect(url, function (err, db) {
  dbObj = db;
  console.log("DB connect");
});

/**
 * MQTT subscriber (MQTT Server connection & Read resource data)
 */
var mqtt = require("mqtt");
var client = mqtt.connect("mqtt://127.0.0.1")
var tmp;
var hum;
var Co2;

// 접속에 성공하면, 3가지 토픽을 구독.
client.on("connect", function () {
  client.subscribe("tmp");
  console.log("Subscribing tmp");
  client.subscribe("hum");
  console.log("Subscribing hum");
  client.subscribe("Co2");
  console.log("Subscribing Co2");
  client.subscribe("inTp");
  console.log("Subscribing inTp");
  client.subscribe("inHd");
  console.log("Subscribing inHd");
  client.subscribe("inCo2");
  console.log("Subscribing inCo2");
})

// MQTT 응답 메세지 수신시 동작
client.on("message", function (topic, message) {
  console.log(topic + ": " + message.toString()); // 수신한 메세지 Topic 출력
  var obj = JSON.parse(message); // 수신한 메세지의 데이터를 obj 저장
  obj.create_at = new Date(); // 현재 날짜 데이터를 obj에 추가함.
  console.log(obj);

  var inTp = dbObj.collection('inTp');
  var inHd = dbObj.collection('inHd');
  var inCo2 = dbObj.collection('inCo2');

  if (topic == "inTp") {
    inTp.save(obj, function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log(JSON.stringify(result));
      }
    });
  }

  else if (topic == "inHd") {
    inHd.save(obj, function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log(JSON.stringify(result));
      }
    });
  }

  else if (topic == "inCo2") {
    inCo2.save(obj, function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log(JSON.stringify(result));
      }
    });
  }

  else if (topic == "tmp") {
    tmp = obj;
  }

  else if (topic == "hum") {
    hum = obj;
  }

  else if (topic == "Co2") {
    Co2 = obj;
  }

});

// get data from MongDB and then send it to HTML page using socket
// Mongo DB에서 최근 데이터 불러와서, HTML 페이지에 업데이트
var io = require("socket.io")(server);
io.on("connection", function (socket) {


  var inTp = dbObj.collection("inTp");
  var inHd = dbObj.collection("inHd");
  var inCo2 = dbObj.collection("inCo2");

  socket.on("socket_up_getNow", function (data) {
    socket.emit("socket_up_tmp", JSON.stringify(tmp));
    socket.emit("socket_up_hum", JSON.stringify(hum));
    socket.emit("socket_up_Co2", JSON.stringify(Co2));
  })

  socket.on("socket_req_date", function (data) {
    client.unsubscribe("tmp");
    client.unsubscribe("hum");
    client.unsubscribe("Co2");
    console.log("-----unsubscribe Now-----");

    inTp.remove({});
    inHd.remove({});
    inCo2.remove({});

    console.log("req date Information");
    console.log(data);
    client.publish('date', data);
  });

  socket.on("socket_evt_update", function (data) {

    inTp.find({}).sort({ _id: 1 }).limit(5).toArray(function (err, results) {
      if (!err) {
        console.log(results[0]);
        for (var i = 0; i < results.length; i++) {
          socket.emit("socket_up_inTp", JSON.stringify(results[i]));
        }
      }
    });

    inHd.find({}).sort({ _id: 1 }).limit(5).toArray(function (err, results) {
      if (!err) {
        console.log(results[0]);
        for (var i = 0; i < results.length; i++) {
          socket.emit("socket_up_inHd", JSON.stringify(results[i]));
        }
      }
    });

    inCo2.find({}).sort({ _id: 1 }).limit(5).toArray(function (err, results) {
      if (!err) {
        console.log(results[0]);
        for (var i = 0; i < results.length; i++) {
          socket.emit("socket_up_inCo2", JSON.stringify(results[i]));
        }
      }
    });

    client.subscribe("tmp");
    client.subscribe("hum");
    client.subscribe("Co2");
    console.log("-------subscribe Now-------");
  });


});

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  var port = parseInt(val, 10);
  if (isNaN(port)) {
    // named pipe
    return val;
  }
  if (port >= 0) {
    // port number
    return port;
  }
  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}



