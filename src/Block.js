import React from 'react';
import classnames from 'classnames';
import blockImage from './assets/block1.png';
import block2Image from './assets/block2.png';
import block3Image from './assets/block3.png';
import block4Image from './assets/block4.png';
import block5Image from './assets/block5.png';
import block6Image from './assets/block6.png';
import coin from './assets/peng.png';
import powerup from './assets/extraliv.png';
import shield from './assets/sköld.png';
import nyckelImage from './assets/nyckel.png';
import portalImage from './assets/portal.png';
import dörrImage from './assets/dörr.png';
import cannon from './assets/kanon.png';
import cannon2 from './assets/kanon2.png';
import laser from './assets/laser.png';
import button from './assets/knapp.png';
import bomb from './assets/bomb.png';
import hacka from './assets/hacka.png';
import './block.css';

function Block(props) {
    let block = null;
    const blockClasses = classnames({
        pixelated: true,
        key: props.block === 2,
        door: props.block === 3,
        portal: props.block === 8,
        coin: props.block === 11,
        shield: props.block === 13,
        powerup: props.block === 12,
        cannon: props.block === 14,
        laser: props.block === 15,
        button: props.block === 16,
        bomb: props.block === 17,
        active: props.bombActive,
        block: [1, 4, 5, 6, 7, 9, 10, 13, 14, 15, 16, 17, 18, 19].includes(props.block),
        open: props.doorOpen
    });

    const viewDistanceX = Math.abs(props.gubbeX - props.x);
    const viewDistanceY = Math.abs(props.gubbeY - props.y);

    const distanceToOpacity = {
        1: 1,
        2: .9,
        3: .7,
        4: .6,
        5: .3,
        6: .1,
        7: .07,
        8: .03
    };
    const blockStyle = props.gubbeX ? { opacity: (viewDistanceX < 5 && viewDistanceY < 5 ) ? distanceToOpacity[viewDistanceX + viewDistanceY] : 0, position: 'absolute', top: `${parseInt(props.y * 7)}%`, left: `${parseInt(props.x * 12)}%`} : { width: '50px', height: '50px'};
    switch(props.block) {
        case 1:
            block = <img alt="" src={blockImage} className={blockClasses} style={blockStyle} />;
            break;
        case 2:
            block = <img alt="" src={nyckelImage} className={blockClasses} style={blockStyle} />;
            break;
        case 3:
            block = <img alt="" src={dörrImage} className={blockClasses} style={blockStyle} />;
            break;
        case 4:
            block = <img alt="" src={block2Image} className={blockClasses} style={blockStyle} />;
            break;
        case 5:
            block = <img alt="" src={block3Image} className={blockClasses} style={blockStyle} />;
            break;
        case 6:
            block = <img alt="" src={block4Image} className={blockClasses} style={blockStyle} />;
            break;
        case 7:
            block = <img alt="" src={block5Image} className={blockClasses} style={blockStyle} />;
            break;
        case 8:
            block = <img alt="" src={portalImage} className={blockClasses} style={blockStyle} />;
            break;
        case 9:
            block = <img alt="" src={block6Image} className={blockClasses} style={blockStyle} />;
            break;
        case 10:
            block = <div className={blockClasses} style={{...blockStyle, border: '2px solid white', opacity: .5}}></div>;
            break;
        case 11:
            block = <img alt="" src={coin} className={blockClasses} style={blockStyle} />;
            break;
        case 12:
            block = <img alt="" src={powerup} className={blockClasses} style={blockStyle} />;
            break;
        case 13:
            block = <img alt="" src={shield} className={blockClasses} style={blockStyle} />;
            break;
        case 14:
            block = <img alt="" src={cannon} className={blockClasses} style={blockStyle} />;
            break;
        case 15:
            block = <img alt="" src={laser} className={blockClasses} style={blockStyle} />;
            break;
        case 16:
            block = <img alt="" src={button} className={blockClasses} style={blockStyle} />;
            break;
        case 17:
            block = <img alt="" src={bomb} className={blockClasses} style={blockStyle} />;
            break;
        case 18:
            block = <img alt="" src={cannon2} className={blockClasses} style={blockStyle} />;
            break;
        case 19:
            block = <img alt="" src={hacka} className={blockClasses} style={blockStyle} />;
        default:
            break;
    }

    return (
        <div className="block">
            {block}
        </div>
    );
}

export default Block;
