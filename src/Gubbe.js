import React from 'react';
import classnames from 'classnames';
import gubbeImage from './assets/gubbe.png';
import gubbeFacklaImage from './assets/gubbe-fackla.png';
import './Gubbe.css';

function Gubbe(props) {
    let degreesOfRotation = 0;
    switch (props.gubbeDirection) {
        case 1:
            degreesOfRotation = 0;
            break;
        case 2:
            degreesOfRotation = 90;
            break;
        case 3:
            degreesOfRotation = 180;
            break;
        case 0:
            degreesOfRotation = 270;
            break;
        default:
            break;
    }

    const gubbeClasses = classnames({
        hasShield: props.hasShield,
        isHurt: props.isHurt
    });

    return (
        <div
            className="gubbe pixelated"
            style={props.gubbeX ?
                { top: `${parseInt(props.gubbeY * 14)}%`, left: `${parseInt(props.gubbeX * 7)}%`, width: '7%'}
                :
                { position: 'initial', width: '50px', height: '50px'}}>
            <div className="nametag">{props.playerName}</div>
            <img alt="" className={gubbeClasses} style={{ transform: `rotate(${degreesOfRotation}deg)` }} src={props.hasFackla ? gubbeFacklaImage : gubbeImage} />
        </div>
    );
}

export default Gubbe;
