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
        pixelated: true,
        gubbe: true,
        hasShield: props.hasShield
    });

    return (
        <>
            <div className="nametag" style={{ top: `${parseInt(props.gubbeY * 13)}%`, left: `${parseInt(props.gubbeX * 7)}%`}}>{props.playerName}</div>
            <img alt="" src={props.hasFackla ? gubbeFacklaImage : gubbeImage} className={gubbeClasses} style={props.gubbeX ? { top: `${parseInt(props.gubbeY * 14)}%`, left: `${parseInt(props.gubbeX * 7)}%`, width: '7%', transform: `rotate(${degreesOfRotation}deg)`} : { position: 'initial', width: '50px', height: '50px'}} />
        </>
    );
}

export default Gubbe;
