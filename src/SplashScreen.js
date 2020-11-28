import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import splash from './assets/titelskärm.png';
import playbutton from './assets/spela.png';
import { powerup } from './Audio';

const socket = io('https://ollesspelserver.herokuapp.com/', { transports: ['websocket'], rejectUnauthorized: false });
// const socket = io('http://localhost:3003', { transports: ['websocket'], rejectUnauthorized: false });

export default function SplashScreen(props) {
    const [showWindow, setShowWindow] = useState(false);
    const [availableRooms, setAvailableRooms] = useState([]);

    useEffect(() => {
        socket.emit('checkForRooms');
        socket.on('roomsAvailable', (rooms) => {
            if (rooms.length > 0) powerup.play();
            setAvailableRooms(rooms);
        })
    }, []);

    console.log(availableRooms);
    return (
        <div className="title_screen_wrapper">
            <img alt="" className="title_screen pixelated" src={splash} />
            {showWindow &&
            <div className="chooseplaymode">
                <div>
                    <h2>Starta spelet</h2>
                    <p>Välj ett pågående multiplayer till höger, eller skriv in ditt namn och bara tryck på spela för att starta ett eget spel</p>
                    <input placeholder="Skriv ditt namn" className="nameentry" type="text" onChange={(e) => props.setPlayerName(e.target.value)} value={props.playerName} />
                    <button disabled={!props.playerName} className="startplaying" onClick={props.playGame}>Börja spela</button>
                </div>
                <div>
                    <h2>Pågående spel</h2>
                    <div className="list">
                        {availableRooms.sort((a, b) => b.lastUpdated - a.lastUpdated).map(room => <div className={props.multiPlayerRoom === room.number ? 'roomselected' : ''} key={room.number} onClick={() => props.updateMultiPlayerRoom(room.number)}><input type="checkbox" checked={props.multiPlayerRoom === room.number} />Spel startat av: <span className="startedby">{room.startedBy}</span> {room.players} inne <sup>({room.number})</sup></div>)}
                        {availableRooms.length === 0 && <span>(inga just nu...)</span>}
                    </div>
                </div>
            </div>
            }
            <img alt="" className="playbutton pixelated" onClick={() => setShowWindow(true)} src={playbutton} />
        </div>
    )
}