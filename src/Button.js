import React from 'react';
import button from './assets/button.png';

function Buttons(props) {

    return (
        <>
            <img alt="" src={button} className="move-button pixelated up" onClick={() => props.move(1)} />
            <img alt="" src={button} className="move-button pixelated right" onClick={() => props.move(2)}  />
            <img alt="" src={button} className="move-button pixelated down" onClick={() => props.move(3)} />
            <img alt="" src={button} className="move-button pixelated left" onClick={() => props.move(0)} />
        </>
    );
}

export default Buttons;
