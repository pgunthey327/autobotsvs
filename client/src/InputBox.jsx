import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

const InputBox = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    if (message.trim() !== "") {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="input-box">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={handleSendMessage}>
        <FaPaperPlane />
      </button>
    </div>
  );
};

export default InputBox;
