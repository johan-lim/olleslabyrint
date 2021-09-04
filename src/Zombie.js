import React from 'react';
import zombieImage from './assets/zombie.png';
import lavaMonsterImage from './assets/lavamonster.png';
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
    2: 0.9,
    3: 0.7,
    4: 0.5,
    5: 0.4,
    6: 0.2,
    7: 0.1,
    8: 0.05,
  };

  const hasFackla = props.hasFackla;

  const viewDistanceX = Math.abs(props.gubbeX - props.zombieX);
  const viewDistanceY = Math.abs(props.gubbeY - props.zombieY);

  return (
    <img
      alt=""
      src={props.isMonster ? lavaMonsterImage : zombieImage}
      className="pixelated gubbe zombie"
      style={
        props.zombieX
          ? {
              opacity:
                viewDistanceX < (hasFackla ? 5 : 3) &&
                viewDistanceY < (hasFackla ? 5 : 3)
                  ? distanceToOpacity[viewDistanceX]
                  : 0,
              top: `${parseInt((props.zombieY - props.gubbeY + 3) * 14)}%`,
              left: `${parseInt((props.zombieX - props.gubbeX + 3) * 7)}%`,
              width: '7%',
              transform: `rotate(${degreesOfRotation}deg)`,
            }
          : { position: 'initial', width: '50px', height: '50px' }
      }
    />
  );
}

export default Zombie;
