import { useState } from 'react';
import './App.css';
import Game from './components/Game';
import Chat from './components/Chat';

function App() {
  const [openChat, setOpenChat] = useState(false);

  const toggleChat = () => {
    setOpenChat(!openChat);
  }

  return (
    <div className="App">

      <div>
        <Game />
      </div>


      <div>
        <button onClick={toggleChat}>Open/Close chat</button>
         {openChat && <Chat /> }
      </div>



    </div>
  );
}

export default App;