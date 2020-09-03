import React from 'react';
import zombieImage from './assets/zombie.png';
import './Gubbe.css';

function Zombie(props) {
    let degreesOfRotation = 0;
    switch (props.zombieDirection) {
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

    const distanceToOpacity = {
        1: .9,
        2: .6,
        3: .3,
        4: .1
    };

    const viewDistanceX = Math.abs(props.gubbeX - props.zombieX);
    const viewDistanceY = Math.abs(props.gubbeY - props.zombieY);

    return (
        <img src={zombieImage} className="pixelated gubbe zombie" style={props.zombieX ? { opacity: (viewDistanceX < 4 && viewDistanceY < 4) ? distanceToOpacity[viewDistanceX]: 0, top: `${parseInt(props.zombieY * 7)}%`, left: `${parseInt(props.zombieX * 12)}%`, width: '13%', transform: `rotate(${degreesOfRotation}deg)`} : { position: 'initial', width: '50px', height: '50px'} } />
    );
}

export default Zombie;
