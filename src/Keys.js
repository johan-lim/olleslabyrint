import React from 'react';
import './Keys.css';
import Knapp from './assets/knapp.png';

function Keys(props) {
  return (
    <div className="keys">
        <img src={Knapp} onClick={() => props.getKeyPress(0)} className="button pixelated left" />
        <img src={Knapp} onClick={() => props.getKeyPress(1)} className="button pixelated up" />
        <img src={Knapp} onClick={() => props.getKeyPress(3)} className="button pixelated down" />
        <img src={Knapp} onClick={() => props.getKeyPress(2)} className="button pixelated right" />
    </div>
  );
}

export default Keys;
