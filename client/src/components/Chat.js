import { useEffect, useState } from 'react';
import io from "socket.io-client";

const socket = io.connect('http://192.168.0.105:3001');

function Chat() {
  const [message, setMessage] = useState('');
  const [messageReceived, setMessageReceived] = useState('');

  const sendMessage = () => {
    socket.emit("send_chat_message", { message });
  }

  useEffect(() => {
    socket.on("receive_chat_message", (data) => {
      setMessageReceived(data.message);
    })
  }, [socket]);

  return (
    <div>
      <input placeholder="Message..."
        onChange={e => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send Message</button>

      <h1>Message:</h1>
      <p>
        {messageReceived}
      </p>
   
      <hr />

    </div>
  );
}

export default Chat;