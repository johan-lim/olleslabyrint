import React, { useState } from 'react';
import splash from './assets/titelskärm.png';
import playbutton from './assets/spela.png';
import entercode from './assets/angekod.png';

export default function SplashScreen(props) {
    const [showCodeEntry, setShowCodeEntry] = useState(false);

    return (
        <div className="title_screen_wrapper">
            <img alt="" className="title_screen pixelated" src={splash} />
            <img alt="" className="playbutton pixelated" onClick={props.playGame} src={playbutton} />
            <img alt="" className="entercode pixelated" onClick={() => setShowCodeEntry(true)} src={entercode} />
            <input placeholder="Skriv ditt namn" className="nameentry" type="text" onChange={(e) => props.setPlayerName(e.target.value)} value={props.playerName} />
            {showCodeEntry && 
            <>
                <input placeholder="Skriv in kod" className="multiplayer" type="text" onChange={props.updateMultiPlayerRoom} value={props.multiPlayerRoom} />
            </>}
        </div>
    )
}