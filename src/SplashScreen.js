import React from 'react';
import splash from './assets/titelskärm.png';
import playbutton from './assets/spela.png';

export default function SplashScreen(props) {
    return (
        <div className="title_screen_wrapper">
            <img alt="" className="title_screen pixelated" src={splash} />
            <input placeholder="Skriv ditt namn" className="nameentry" type="text" onChange={(e) => props.setPlayerName(e.target.value)} value={props.playerName} />
            <input placeholder="Skriv in kod för multiplayer" className="multiplayer" type="text" onChange={props.updateMultiPlayerRoom} value={props.multiPlayerRoom} />
            <img alt="" className="playbutton pixelated" onClick={props.playGame} src={playbutton} />
        </div>
    )
}