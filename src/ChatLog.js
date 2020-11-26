import React, { useState } from 'react';

function ChatLog(props) {
    const [currentMessage, setCurrentMessage] = useState('');

    const checkForEnter = (input) => {
        if (input.key === 'Enter') {
            sendMessage();
        }
    }

    const sendMessage = () => {
        props.sendMessage(currentMessage);
        setCurrentMessage('');
    }
    return (
        <div className="chatwindow">
            <h3>Chatt / Aktivitet</h3>
            <div className="messages">
                {props.messages.map((message, i) => {
                    return (
                        message.action ? <p key={i}><span className="player">{message.player}</span> <span className="action">{message.action}</span></p>
                        :
                        <p key={i}><span className="player">{message.player}</span> säger {message.message}</p>
                    )                    
                }
                    
                )}
            </div>
            <input className="chatinput" placeholder="Skriv meddelande här..." type="text" value={currentMessage} onKeyDown={checkForEnter} onChange={(e) => setCurrentMessage(e.target.value)} />
            <button className="sendbutton" onClick={sendMessage}>Skicka</button>
        </div>
    )
}

export default ChatLog;
