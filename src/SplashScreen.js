import React from 'react';
import splash from './assets/titelskärm.png';
import playbutton from './assets/spela.png';

export default function SplashScreen(props) {
    return (
        <div className="title_screen_wrapper">
            <img className="title_screen pixelated" src={splash} />
            <img className="playbutton pixelated" onClick={props.playGame} src={playbutton} />
        </div>
    )
}