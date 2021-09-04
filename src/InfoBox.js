import React from 'react';
import nyckelImage from './assets/nyckel.png';
import shieldImage from './assets/sköld.png';
import hackaImage from './assets/hacka.png';
import facklaImage from './assets/fackla.png';
import gunImage from './assets/gun.png';

function InfoBox(props) {
  const inventory = {
    key: <img key="key" alt="" className="pixelated key" src={nyckelImage} />,
    shield: (
      <img
        style={{ opacity: props.shieldHealth }}
        key="shield"
        alt=""
        className="pixelated key"
        src={shieldImage}
      />
    ),
    hacka: (
      <img
        style={{ opacity: props.hackaHealth }}
        key="hacka"
        alt=""
        className="pixelated key"
        src={hackaImage}
      />
    ),
    fackla: (
      <img key="fackla" alt="" className="pixelated key" src={facklaImage} />
    ),
    gun: <img key="gun" alt="" className="pixelated key" src={gunImage} />,
  };

  return (
    <>
      <div className="info">
        <h3>Inställningar</h3>
        <span onClick={props.toggleMusic}>
          Musik {props.music ? 'på' : 'av'}
        </span>
        <span onClick={props.toggleSoundEffects}>
          Ljudeffekter {props.soundEffects ? 'på' : 'av'}
        </span>
      </div>
      <div className="info">
        <h3>Stats</h3>
        <span>Poäng: {props.points}</span>
        <span>Nivå: {props.level + 1}</span>
        <span>Liv: {props.lives}</span>
        <span>
          Ryggsäck:{' '}
          {props.inventory.length
            ? props.inventory.map((item) => inventory[item])
            : '(tom)'}
        </span>
      </div>
    </>
  );
}

export default InfoBox;
