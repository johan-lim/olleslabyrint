import React from 'react';
import gubbeImage from './assets/gubbe.png';
import gubbeFacklaImage from './assets/gubbe-fackla.png';
import './Gubbe.css';

function SlaveGubbe(props) {
    let degreesOfRotation = 0;
    switch (props.slaveDirection) {
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
        4: .5,
        5: .4,
        6: .2,
        7: .1,
        8: .05
    };

    const hasFackla = props.hasFackla;

    const viewDistanceX = Math.abs(props.gubbeX - props.slaveX);
    const viewDistanceY = Math.abs(props.gubbeY - props.slaveY);


    return (
        <>
            <div className="nametag" style={{ top: `${parseInt((props.slaveY - props.gubbeY + 3) * 13)}%`, left: `${parseInt((props.slaveX - props.gubbeX + 3) * 7)}%`}}>{props.slaveName}</div>
            <img alt="" src={props.hasFackla ? gubbeFacklaImage : gubbeImage} className="pixelated gubbe" style={ props.slaveX ? { opacity: (viewDistanceX < (hasFackla ? 5 : 3) && viewDistanceY < (hasFackla ? 5 : 3)) ? distanceToOpacity[viewDistanceX]: 0, top: `${parseInt((props.slaveY - props.gubbeY + 3) * 14)}%`, left: `${parseInt((props.slaveX - props.gubbeX + 3) * 7)}%`, width: '7%', transform: `rotate(${degreesOfRotation}deg)`} : { position: 'initial', width: '50px', height: '50px'} } />
        </>
    );
}

export default SlaveGubbe;
