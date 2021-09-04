import React from 'react';
import classnames from 'classnames';
import skottImage from './assets/skott.png';

function Skott(props) {
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

  const viewDistanceX = Math.abs(props.gubbeX - props.skottX);
  const viewDistanceY = Math.abs(props.gubbeY - props.skottY);

  const skottClasses = classnames({
    pixelated: true,
    skott: true,
  });

  return (
    <img
      alt=""
      src={skottImage}
      className={skottClasses}
      style={{
        opacity:
          viewDistanceX < (hasFackla ? 5 : 3) &&
          viewDistanceY < (hasFackla ? 5 : 3)
            ? distanceToOpacity[viewDistanceX]
            : 0,
        position: 'absolute',
        top: `${parseInt((props.skottY - props.gubbeY + 3) * 14)}%`,
        left: `${parseInt((props.skottX - props.gubbeX + 3) * 7)}%`,
      }}
    />
  );
}

export default Skott;
