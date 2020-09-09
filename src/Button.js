import React from 'react';
import button from './assets/button.png';

function Buttons(props) {

    return (
        <>
            <img alt="" src={button} className="move-button pixelated up" onClick={(e) => {e.preventDefault(); props.move(1)} } />
            <img alt="" src={button} className="move-button pixelated right" onClick={(e) => {e.preventDefault();props.move(2)} } />
            <img alt="" src={button} className="move-button pixelated down" onClick={(e) => {e.preventDefault(); props.move(3)} } />
            <img alt="" src={button} className="move-button pixelated left" onClick={(e) => {e.preventDefault(); props.move(0)} } />
        </>
    );
}

export default Buttons;
