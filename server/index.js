const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3001;
const playersFile = 'players.json';
let playersData = [];

app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

fs.readFile(playersFile, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading players file:', err);
  } else {
    try {
      playersData = JSON.parse(data);
    } catch (parseErr) {
      console.error('Error parsing players file:', parseErr);
    }
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', (data) => {
    const { room, playerName } = data;
    socket.join(room);

    const playerInfo = {
      id: socket.id,
      playerName,
      socketId: socket.id,
      room,
      score: 0,
    };

    playersData.push(playerInfo);

    fs.writeFile(playersFile, JSON.stringify(playersData), (writeErr) => {
      if (writeErr) {
        console.error('Error writing players file:', writeErr);
      } else {
        console.log('Player data saved to file');
     
        io.emit('update_players', playersData);
      }
    });
  });

  socket.on('disconnect', () => {
    const disconnectedPlayerIndex = playersData.findIndex((player) => player.id === socket.id);
  
    if (disconnectedPlayerIndex !== -1) {
      const disconnectedPlayer = playersData[disconnectedPlayerIndex];
      const disconnectedPlayerName = disconnectedPlayer.playerName;
  
      playersData.splice(disconnectedPlayerIndex, 1);
  
      fs.writeFile(playersFile, JSON.stringify(playersData), (writeErr) => {
        if (writeErr) {
          console.error('Error writing players file:', writeErr);
        } else {
          console.log('Player data saved to file');
          // update ALL players
          io.emit('update_players', playersData);
        }
      });
  
      socket.to(disconnectedPlayer.room).emit('player_disconnected', {
        playerId: socket.id,
        playerName: disconnectedPlayerName
      });
    }
  });

  socket.on('send_message', (data) => {
    socket.to(data.room).emit('receive_message', data);
   
  });

  socket.on('game_over', (data) => {
    const { playerId, score } = data;
    const playerIndex = playersData.findIndex((player) => player.id === playerId);

    if (playerIndex !== -1) {
      playersData[playerIndex].score = score;

      fs.writeFile(playersFile, JSON.stringify(playersData), (writeErr) => {
        //handle errorssssssss
      });
    }
  });

  socket.on('send_chat_message', (data) => {
    const { message } = data;
    io.emit('receive_chat_message', { message });
  });
  

});


app.get('/players', (req, res) => {
  fs.readFile(playersFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading players file:', err);
      res.status(500).send('Error reading players file');
    } else {
      try {
        const playersData = JSON.parse(data);
        const sortedPlayers = playersData.sort((a, b) => a.score - b.score); 
        res.json(sortedPlayers);
      } catch (parseErr) {
        console.error('Error parsing players file:', parseErr);
        res.status(500).send('Error parsing players file');
      }
    }
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

server.listen(PORT, () => {
  console.log('Server is running on port', PORT);
});
