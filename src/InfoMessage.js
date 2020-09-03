import React from 'react';
import duvann from './assets/duvann.png';
import dudog from './assets/dudog.png';
import gameover from './assets/gameover.png';

function InfoMessage(props) {
    if (props.message === 'död') {
        return (
            <img src={dudog} className="pixelated info_message" />
        );
    } else if (props.message === 'vann') {
        return (
            <img src={duvann} className="pixelated info_message" />
        );
    } else if (props.message === 'gameover') {
        return (
            <img src={gameover} className="pixelated info_message" />
        );
    } else return null;
}

export default InfoMessage;
