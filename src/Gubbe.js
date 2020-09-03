import React from 'react';
import classnames from 'classnames';
import gubbeImage from './assets/gubbe.png';
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
        <img src={gubbeImage} className={gubbeClasses} style={props.gubbeX ? { top: `${parseInt(props.gubbeY * 7)}%`, left: `${parseInt(props.gubbeX * 12)}%`, width: '13%', transform: `rotate(${degreesOfRotation}deg)`} : { position: 'initial', width: '50px', height: '50px'}} />
    );
}

export default Gubbe;
