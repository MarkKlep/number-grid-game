import React, { useState, useEffect, useRef } from 'react';
import io from "socket.io-client";
import "../style/Game.css";

const socket = io.connect('http://192.168.0.105:3001');

const Game = () => {
  const [fieldSize, setFieldSize] = useState(3);
  const [field, setField] = useState([]);
  const fieldIsNotGenerated = useRef(true);
  const [timer, setTimer] = useState(0);
  const [startGame, setStartGame] = useState(false);
  const [time, setTime] = useState(0);
  const [incorrectClick, setIncorrectClick] = useState(false);
  const loss = 5;
  const [timeRecieved, setTimeReceived] = useState(0);
  const [room, setRoom] = useState("");
  const [roomIn, setRoomIn] = useState("");
  const [text, setText] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerNameRecieved, setPlayerNameRecieved] = useState("");


const [allPlayers, setAllPlayers] = useState([]);

  useEffect(() => {
    fetch('/players')
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setAllPlayers(data);
      })
      .catch(error => console.error('Error fetching players:', error));
  }, [startGame, field]);

  useEffect(() => {
    socket.on('update_players', updatedPlayers => {
      setAllPlayers(updatedPlayers);
    });

    return () => {
      socket.off('update_players');
    };
  }, []);



  const joinRoom = () => {
    if (!playerName) {
      alert("Enter your name");
      return;
    }
  
    if (room !== "") {
      socket.emit("join_room", { room, playerName }); // Отправка имени игрока и roomID на сервер
    }
  
    setRoomIn(room);
    setTime(0);
    setTimeReceived(0);
    setPlayerNameRecieved("");
  };
  

  const generateGrid = () => {
    setTimer(0);
    const grid = [];
    const max = fieldSize*fieldSize;
    const min = 1;

    for (let i = 0; i < fieldSize; i++) {
      const row = [];
      for (let k = 0; k < fieldSize; k++) {
        row.push(Math.floor(Math.random() * (max - min) + min));
      }
      grid.push(row);
    }

    setField(grid);
    fieldIsNotGenerated.current = false;

    setStartGame(true);
  }

  const handleCellClick = (number, rowIndex, colIndex) => {
    if (!fieldIsNotGenerated.current) {
      let isSmallest = true;

      for (let i = 0; i < field.length; i++) {
        for (let j = 0; j < field[i].length; j++) {
          if (number > field[i][j] && field[i][j] !== 'X') {
            isSmallest = false;
            setTime(time + loss);
            setIncorrectClick(true);
            break;
          }
        }
      }

      if (isSmallest) {
       const updatedField = field.map(row => [...row]);
       updatedField[rowIndex][colIndex] = 'X';
       setField(updatedField);
      }

    }
  }

  useEffect(() => {
    const isAllX = field.every(row => row.every(cell => cell === 'X'));

    if (isAllX) {
      setStartGame(false);
      setTime(time + timer);
      fieldIsNotGenerated.current = true;
    } 

  }, [field]);

  useEffect(() => {
    socket.emit("send_message", { time, room, playerName });
  }, [time]);

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setTimeReceived(data.time);
      setPlayerNameRecieved(data.playerName);
    });
  
    socket.on('player_disconnected', (data) => {
      alert('Player ' + data.playerName + ' has disconnected');
    });
  
    return () => {
      socket.off("receive_message");
      socket.off('player_disconnected');
    };
  }, [socket]);
  

  useEffect(() => {
    let interval;
    if (!fieldIsNotGenerated.current) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000); 
    }

    if (!startGame) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [startGame]);

  useEffect(() => {
    if (incorrectClick) {
      const timeoutId = setTimeout(() => {
        setIncorrectClick(false);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [incorrectClick]);

  useEffect(() => {
    socket.emit('game_over', { playerId: socket.id, score: time });
  }, [startGame]);

  return (
    <div>
      <h1>7.	ЧИСЛА</h1>

      <input 
        placeholder='Name...'
        value={text}
        onChange={e => setText(e.target.value)} 
      />
      <button onClick={() => {setPlayerName(text); setText("");}}>Set Name</button>

      <div>Name: <i>{playerName}</i></div>

      <div>
        {
          fieldIsNotGenerated.current && (
            <>
              <h2>Оберіть розмір поля: </h2>
              <input
                type="number"
                value={fieldSize}
                min={2}
                max={10}
                onChange={e => setFieldSize(e.target.value)}
                onKeyDown={e => e.preventDefault()}
              />
              <h2>Поле {fieldSize}x{fieldSize} з числами:</h2>
              <button onClick={generateGrid}>Згенерувати поле</button>
            </>
          )
        }
      </div>

    <div className="sidebar">


    <div>
      {roomIn !== "" && <span>Ви в кімнаті {roomIn}</span>}
      <input placeholder="Room..." value={room} onChange={(e) => setRoom(e.target.value)}/>
      <button onClick={joinRoom}>Join Room</button>
    </div>

    <ul>
      <li>Час за минулу гру: { timer } секунд</li>
      <li>Мій час: { time }</li>
      <li>Штраф: { loss }</li>
      {roomIn !== "" && (<li>Час суперника: { timeRecieved } секунд</li>)}
    </ul>

    <div>{ roomIn === "" ? (
      <h3>Single play</h3>
      ) : (
      <div className='rating-container'>
        <h3>Multi play:</h3>
        {/* players */}
        <h3>PLAYERS</h3>
        <ul>
          {allPlayers.map((player, index) => (
            <li key={player.id}>#{index+1}. {player.playerName}</li>
          ))}
        </ul>
        {/* ---- */}
        <h3>Рейтинг</h3>
        <ul>
          {allPlayers.sort((a, b) => a.score - b.score).map(player => (
            <li key={player.id}>{player.playerName} - Score: {player.score}</li>
          ))}
        </ul>
        
      </div>
      )
    }</div>

    <ul>

    </ul>

    </div>


      {startGame && (
        <div>
          <p>Час: {timer} секунд</p>
          <table>
            <tbody>
              {field.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((num, colIndex) => (
                    <td style={{background: num === "X" ? "grey" : incorrectClick ? "red" : '',
                        color: num === "X" ? "black" : ''  }}
                      key={colIndex}
                      onClick={() => handleCellClick(num, rowIndex, colIndex)}
                    >
                      { num }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


    </div>
  );
};

export default Game;
