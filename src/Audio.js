import musicAudio from './assets/sounds/themetune.mp3';
import endMusicAudio from './assets/sounds/game_done.mp3';
import gubbeDieAudio from './assets/sounds/gubbedie.ogg';
import pengAudio from './assets/sounds/peng.ogg';
import keyAudio from './assets/sounds/key.ogg';
import shieldAudio from './assets/sounds/shield.ogg';
import powerupAudio from './assets/sounds/powerup.ogg';
import portalAudio from './assets/sounds/portal.ogg';
import winAudio from './assets/sounds/win.ogg';
import laserAudio from './assets/sounds/laser.ogg';
import noKeyAudio from './assets/sounds/no_key.ogg';
import bombAudio from './assets/sounds/bomb.ogg';
import explosionAudio from './assets/sounds/explosion.ogg';
import playAudio from './assets/sounds/play.ogg';
import fireAudio from './assets/sounds/fire.ogg';
import shieldUseAudio from './assets/sounds/shield_use.ogg';
import skottAudio from './assets/sounds/skott.ogg';
import getGunAudio from './assets/sounds/get_gun.ogg';

export const gubbeDie = new Audio(gubbeDieAudio);
export const peng = new Audio(pengAudio);
export const key = new Audio(keyAudio);
export const shield = new Audio(shieldAudio);
export const powerup = new Audio(powerupAudio);
export const portal = new Audio(portalAudio);
export const win = new Audio(winAudio);
export const laser = new Audio(laserAudio);
export const noKey = new Audio(noKeyAudio);
export const music = new Audio(musicAudio);
export const endMusic = new Audio(endMusicAudio);
export const bomb = new Audio(bombAudio);
export const explosion = new Audio(explosionAudio);
export const play = new Audio(playAudio);
export const fire = new Audio(fireAudio);
export const shieldUse = new Audio(shieldUseAudio);
export const skott = new Audio(skottAudio);
export const getGun = new Audio(getGunAudio);


music.addEventListener('timeupdate', function(){
    var buffer = .20
    if(this.currentTime > this.duration - buffer){
        this.currentTime = 0
        this.play()
    }
});
