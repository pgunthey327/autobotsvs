import React from 'react';
import MessageList from './MessageList';



const Chatbot = ({messages, loader}) => {

  return (
    <div>
      <MessageList messages={messages} loader={loader} />
    </div>
  );
};

export default Chatbot;
