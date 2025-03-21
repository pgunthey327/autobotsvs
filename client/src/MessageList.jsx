import React from 'react';
import ReactMarkdown from 'react-markdown';
import { renderToString } from 'react-dom/server';
import parse  from 'html-react-parser';
import './App.css';

document.body.addEventListener("click", function (evt) {
  if(evt.target.localName === "pre" || evt.target.localName === "code"){
    const textArea = document.createElement("textarea");
    textArea.value = evt.target.innerText;
    document.body.appendChild(textArea);
    
    // Select and copy the content
    textArea.select();
    document.execCommand("copy");
    
    // Remove the temporary text area element
    document.body.removeChild(textArea);
    showToast();
  }
});

const renderMessage = msg => {
  const message = renderToString(<ReactMarkdown>{msg}</ReactMarkdown>).replaceAll("<pre>",
    `<div id="toast" className="toast">Copied to clipboard</div>
    <div className="tooltip" style="width:100%">
    <pre style="cursor:grab" >`).replaceAll("</pre>", '</pre> <span className="tooltiptext">Click to copy</span></div>' );
    return parse(message);
}

const renderImage = img => {
   var blob = new Blob( [ img ], { type: "image/jpeg" } );
    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL( blob );
    return <img src={imageUrl} alt="" style={{maxHeight:"200px", maxWidth:"200px"}}></img>;
}

// Show the toast notification
function showToast() {
  const toast = document.getElementById("toast");
  toast.classList.add("show");

  // Hide the toast after 3 seconds
  setTimeout(() => {
      toast.classList.remove("show");
  }, 3000);
}


const MessageList = ({ messages, loader }) => {
  return (
    <div className="message-list">
      {messages.map( (message) => {
        return (
          <>
          <div style={{width:"100%",display: "flex", flexDirection: "row", justifyContent: message.sender === 'bot' ? 'left' : 'right', marginBottom: "10px"}}>
            <div
              key={message.id}
              className={`${message.sender === 'bot' ? 'bot-message' : 'user-message'}`}
            >
              {message.imageSelected && renderImage(message.imageSelected)}
              {renderMessage(message.text)}
            </div>
            
          </div>
          </>
      )})}
      {loader && (<span class="loading"></span>)}
    </div>
  );
};

export default MessageList;
