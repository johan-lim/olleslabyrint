import React from 'react';
import gunButton from './assets/gun.png';

function GunButton(props) {

    return (
        <img alt="" src={gunButton} className="gun-button pixelated" onClick={props.fireGun} />
    );
}

export default GunButton;
