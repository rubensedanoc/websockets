// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const express = require("express");
var bodyParser = require("body-parser");
const { redisClient, getRoomFromCache, addMessageToCache } = require("./redis");
const { addUser, getUser, deleteUser } = require("./users");
const {
  addConnectedUser,
  removeConnectedUser,
  getConnectedUsers,
} = require("./connectedUsers");

const app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve frontend
app.get("/", async (req, res) => {
  res.render("index");
});
app.post("/toEmit", async (req, res) => {
  console.log("receiving data ...");
  console.log("body is ", req.body);
  //console.log('body is ',req.body.to);
  /*for(var i = 0; i < req.body.to.length; i++)
  {
    var tablename = req.body.to[i];
    console.log(tablename)
  }*/
  //console.log(io);

  for (const toElement of req.body.to) {
    io.to(toElement).emit(req.body.event.name, req.body.event.data);
  }
  res.send({ msg: "Enviado con exito" });
});

// [START cloudrun_websockets_server]
// Initialize Socket.io
const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "https://wa-app.restaurant.pe:444",
  },
});

io.set;

// [START cloudrun_websockets_redis_adapter]
const { createAdapter } = require("@socket.io/redis-adapter");
// Replace in-memory adapter with Redis
const subClient = redisClient.duplicate();
io.adapter(createAdapter(redisClient, subClient));
// [END cloudrun_websockets_redis_adapter]
// Add error handlers
redisClient.on("error", (err) => {
  console.error(err.message);
});

subClient.on("error", (err) => {
  console.error(err.message);
});

// Listen for new connection
io.on("connection", (socket) => {
  const { token, userId } = socket.handshake.query;

  //let tokenData = null;
  /*try {
    tokenData = verify(token, authConfig.secret);
    //logger.debug(JSON.stringify(tokenData), "io-onConnection: tokenData");
  } catch (error) {
    //logger.error(JSON.stringify(error), "Error decoding token");
    socket.disconnect();
    return io;
  }*/

  //logger.info("Client Connected and added to the list of connected users");
  if (userId) {
    addConnectedUser(+userId);
    io.emit("usersPresenceList", getConnectedUsers());
  }

  socket.on("joinChatBox", (ticketId) => {
    //logger.info("A client joined a ticket channel");
    socket.join(ticketId);
  });

  socket.on("joinNotification", () => {
    //logger.info("A client joined notification channel");
    socket.join("notification");
  });

  socket.on("joinTickets", (status) => {
    //logger.info(`A client joined to ${status} tickets channel.`);
    socket.join(status);
  });

  socket.on("disconnect", () => {
    /*logger.info(
        "Client disconnected and removed from the list of connected users"
    );*/
    if (userId) {
      removeConnectedUser(+userId);
      io.emit("usersPresenceList", getConnectedUsers());
    }
  });
});
// [END cloudrun_websockets_server]

module.exports = server;
