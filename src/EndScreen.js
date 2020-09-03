import React, { useEffect } from 'react';
import endScreen from './assets/slutskärm.png';
import { endMusic } from './Audio';

export default function EndScreen(props) {
    useEffect(() => {
        endMusic.play();
    }); 
    return (
        <div className="title_screen_wrapper">
            <img className="title_screen pixelated" src={endScreen} />
        </div>
    )
}