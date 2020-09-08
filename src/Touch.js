let xDown = null;                        
let yDown = null;

function getTouches(evt) {
  return evt.touches;
}                                         

export function handleTouchStart(evt) {
    evt.preventDefault();
    const firstTouch = getTouches(evt)[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;
};

export function handleTouchMove(evt, cb) {
    evt.preventDefault();
    if ( ! xDown || ! yDown ) {
        return;
    }

    var xUp = evt.touches[0].clientX;
    var yUp = evt.touches[0].clientY;

    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;

    if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {
        if ( xDiff > 0 ) {
            cb(0);
        } else {
            cb(2);
        }                       
    } else {
        if ( yDiff > 0 ) {
            cb(1);
        } else { 
            cb(3);
        }                                                                 
    }
    xDown = null;
    yDown = null;                                             
};