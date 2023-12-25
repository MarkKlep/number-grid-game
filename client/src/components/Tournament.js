import React, { useState, useEffect } from 'react';
import io from "socket.io-client";

const socket = io.connect('http://192.168.0.105:3001');

function TournamentGame({ startTournament }) {
const [players, setPlayers] = useState([]);
  const [tournament, setTournament] = useState(null);
  const [winner, setWinner] = useState(null);

//   const startTournament = () => {
//     socket.emit('start_tournament');
//   };

  // Подписка на событие обновления игроков
  useEffect(() => {
    socket.on('update_players', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    return () => {
      socket.off('update_players');
    };
  }, []);

  // Обработка события начала следующего матча
  const startNextMatch = () => {
    socket.emit('start_next_match');
  };

  // Обработка событий турнира от сервера
  useEffect(() => {
    socket.on('next_match_info', (nextMatchInfo) => {
      setTournament(nextMatchInfo);
    });

    socket.on('tournament_winner', (tournamentWinner) => {
      setWinner(tournamentWinner);
      setTournament(null);
    });

    return () => {
      socket.off('next_match_info');
      socket.off('tournament_winner');
    };
  }, []);

  return (
    <div>
      <h1>Tournament Mode</h1>
      {winner ? (
        <div>
          <h2>Winner: {winner}</h2>
          <button onClick={() => socket.emit('end_tournament')}>End Tournament</button>
        </div>
      ) : tournament ? (
        <div>
          <h2>Matches:</h2>
          <p>
            {tournament.player1} vs {tournament.player2} - Winner: {tournament.winner || 'Undecided'}
          </p>
          {!tournament.winner && (
            <button onClick={() => socket.emit('end_match', tournament.player1)}>
              Set {tournament.player1} as winner
            </button>
          )}
          <button onClick={startNextMatch}>Start Next Match</button>
        </div>
      ) : (
        <div>
          <h2>Waiting for players to start the tournament...</h2>
          <ul>
            {players.map((player, index) => (
              <li key={index}>{player}</li>
            ))}
          </ul>
          <button onClick={startTournament}>Start Tournament</button>
        </div>
      )}
    </div>
  );
}

export default TournamentGame;
