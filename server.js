const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
const path = require('path');

let players = {};
let star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50
};
let scores = {
  blue: 0,
  red: 0
};

app.use(express.static(__dirname + '/public'));

app.get('/domine', (req, res, next) => {
  //res.sendFile(__dirname + '/index.html');

  const p = path.join(__dirname, 'public', 'index.html');
  console.log(p);

  res.sendFile(p);
});

io.on('connection', socket => {
  console.log('A user ' + socket.id + ' connected.');
  // create a new player and add it to our players object
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
    team: Math.floor(Math.random() * 2) == 0 ? 'red' : 'blue'
  };
  socket.on('playerName', name => {
    players[socket.id].name = name;
    console.log(name);
    socket.emit('playerId', socket.id);
    console.log(players);
  });

  // send players object to new player
  socket.emit('currentPlayers', players);
  // send the star object to the new player
  socket.emit('starLocation', star);
  //send the current scores
  socket.emit('scoreUpdate', scores);
  // send the new player data to all other players
  socket.broadcast.emit('newPlayer', players[socket.id]);

  socket.on('disconnect', () => {
    console.log(
      'User ' + socket.id + '(' + players[socket.id].name + ') disconnected.'
    );
    // remove this player from players object
    delete players[socket.id];
    // emmit a message to all players to remove this player
    io.emit('disconnect', socket.id);
  });

  // when a player moves, update the player data
  socket.on('playerMovement', movementData => {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('starCollected', function() {
    if (players[socket.id].team === 'red') {
      scores.red += 10;
    } else {
      scores.blue += 10;
    }
    star.x = Math.floor(Math.random() * 700) + 50;
    star.y = Math.floor(Math.random() * 500) + 50;
    io.emit('starLocation', star);
    io.emit('scoreUpdate', scores);
  });
});

server.listen(8081, () => {
  console.log(`Listening on ${server.address().port}`);
});
