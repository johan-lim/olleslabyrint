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
        1: 1,
        2: .9,
        3: .7,
        4: .6,
        5: .3,
        6: .1,
        7: .07,
        8: .03,
        9: .01,
        10: .01,
        11: .01,
        12: .005
    };

    const hasFackla = props.hasFackla;

    const viewDistanceX = Math.abs(props.gubbeX - props.zombieX);
    const viewDistanceY = Math.abs(props.gubbeY - props.zombieY);

    return (
        <img alt="" src={zombieImage} className="pixelated gubbe zombie" style={props.zombieX ? { opacity: (viewDistanceX < (hasFackla ? 7 : 4) && viewDistanceY < (hasFackla ? 7 : 4)) ? distanceToOpacity[viewDistanceX]: 0, top: `${parseInt(props.zombieY * 7)}%`, left: `${parseInt(props.zombieX * 12)}%`, width: '13%', transform: `rotate(${degreesOfRotation}deg)`} : { position: 'initial', width: '50px', height: '50px'} } />
    );
}

export default Zombie;
