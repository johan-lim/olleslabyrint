import React from 'react';
import classnames from 'classnames';
import skottImage from './assets/skott.png';

function Skott(props) {
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
    
    const distanceToOpacity = {
        1: .9,
        2: .6,
        3: .3,
        4: .1
    };

    const viewDistanceX = Math.abs(props.gubbeX - props.skottX);
    const viewDistanceY = Math.abs(props.gubbeY - props.skottY);


    const skottClasses = classnames({
        pixelated: true,
        skott: true
    });

    return (
        <img alt="" src={skottImage} className={skottClasses} style={{ opacity: (viewDistanceX < 5 && viewDistanceY < 5) ? distanceToOpacity[viewDistanceX] : 0, position: 'absolute', top: `${parseInt(props.skottY * 7)}%`, left: `${parseInt(props.skottX * 12)}%` }} />
    );
}

export default Skott;
