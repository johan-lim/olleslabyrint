import React from 'react';
import PF from 'pathfinding';
import './GameEngine.css';
import { handleTouchMove } from './Touch';
import Gubbe from './Gubbe';
import Zombie from './Zombie';
import Block from './Block';
import nyckelImage from './assets/nyckel.png';
import shieldImage from './assets/sköld.png';
import hackaImage from './assets/hacka.png';
import facklaImage from './assets/fackla.png';
import gunImage from './assets/gun.png';
import Skott from './Skott';
import InfoMessage from './InfoMessage';
import {
    gubbeDie,
    peng,
    key,
    shield,
    powerup,
    portal,
    win,
    laser,
    noKey,
    music,
    bomb,
    explosion,
    fire,
    shieldUse,
    skott,
    getGun } from './Audio';

import levels from '../src/Levels';

const initialState = {
    gubbeDirection: 1,
    zombies: [],
    bullets: [],
    gunBullets: [],
    zombieSteps: 0,
    gubbeLocked: false,
    inventory: [],
    doorOpen: false,
    hackaHealth: 1,
    shieldHealth: 1,
    bombActive: false,
    message: ''
};

class GameEngine extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            ...initialState,
            level: 0,
            points: 0,
            lives: 3,
            music: false,
            soundEffects: true,
            currentLevel: levels[0].blocks,
            zombies: this.getIndexOfK(levels[0].blocks, 21).map(z =>
                ({ zombieX: z[1], zombieY: z[0], zombieDirection: 3, zombieSteps: 0 }))
                .concat(this.getIndexOfK(levels[0].blocks, 23).map(z =>
                    ({ zombieX: z[1], zombieY: z[0], zombieDirection: 3, zombieSteps: 0, isMonster: true }))),
            gubbeX: this.getIndexOfK(levels[0].blocks, 20)[0][1],
            gubbeY: this.getIndexOfK(levels[0].blocks, 20)[0][0],
            bullets: this.getIndexOfK(levels[0].blocks, 18).map(b =>
                ({ initialX: b[1], initialY: b[0], moving: false }))
        };
    }

    reset() {
        this.setState({
            ...initialState,
            currentLevel: levels[this.state.level].blocks,
            zombies: this.getIndexOfK(levels[this.state.level].blocks, 21).map(z =>
                ({ zombieX: z[1], zombieY: z[0], zombieDirection: 3, zombieSteps: 0 }))
                .concat(this.getIndexOfK(levels[this.state.level].blocks, 23).map(z =>
                    ({ zombieX: z[1], zombieY: z[0], zombieDirection: 3, zombieSteps: 0, isMonster: true }))),
            gubbeX: this.getIndexOfK(levels[this.state.level].blocks, 20)[0][1],
            gubbeY: this.getIndexOfK(levels[this.state.level].blocks, 20)[0][0],
            bullets: this.getIndexOfK(levels[this.state.level].blocks, 18).map(b =>
                ({ initialX: b[1], initialY: b[0], moving: false }))
        } );
    }

    gameover() {
        this.setState({
            ...initialState,
            level: 0,
            points: 0,
            lives: 3,
            music: false,
            soundEffects: true,
            currentLevel: levels[0].blocks,
            zombies: this.getIndexOfK(levels[0].blocks, 21).map(z =>
                ({ zombieX: z[1], zombieY: z[0], zombieDirection: 3, zombieSteps: 0 }))
                .concat(this.getIndexOfK(levels[0].blocks, 23).map(z =>
                    ({ zombieX: z[1], zombieY: z[0], zombieDirection: 3, zombieSteps: 0, isMonster: true }))),            gubbeX: this.getIndexOfK(levels[0].blocks, 20)[0][1],
            gubbeY: this.getIndexOfK(levels[0].blocks, 20)[0][0],
            bullets: this.getIndexOfK(levels[0].blocks, 18).map(b =>
                ({ initialX: b[1], initialY: b[0], moving: false }))
        });
    }

    componentDidMount() {
        document.addEventListener('keyup', this.keyBoard, false);
        document.addEventListener('touchstart', (e) => {
            this.fireGun();
        }, false);
        document.addEventListener('touchmove', (e) => {
            handleTouchMove(e, this.moveGubbe);
        }, false);
        music.loop = true;
        this.zombieTimer = setInterval(() => {
            this.zombieMove();
        }, 1500);
        this.gunTimer = setInterval(() => {
            this.bulletsMove();
        }, 200);
        this.gunBulletsTimer = setInterval(() => {
            this.gunBulletsMove();
        }, 100);
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          window.document.addEventListener('touchmove', e => {
            if(e.scale !== 1) {
              e.preventDefault();
            }
          }, {passive: false});
        }
    }

    componentWillUnmount() {
        clearInterval(this.zombieTimer);
        clearInterval(this.gunTimer);
        clearInterval(this.gunBulletsTimer)
        document.removeEventListener('keyup', this.keyBoard, false);
        // document.removeEventListener('touchstart', handleTouchStart, false);
        document.removeEventListener('touchmove', (e) => {
            handleTouchMove(e, this.moveGubbe);
        }, false);
    }

    keyBoard = (e) => {
        if (e.keyCode === 69) {
            this.props.gotoEditor();
        } else if (e.keyCode === 74){
            this.setState({ level: this.state.level + 1 }, () => {
                this.reset();
            });
        } else if (e.keyCode === 32){
            this.fireGun();
        } else {
            this.moveGubbe(e.keyCode - 37);
        }
    }

    checkGubbeCollision = (direction) => {
        switch (direction) {
            case 0:
                return this.state.currentLevel[this.state.gubbeY][this.state.gubbeX - 1];           
            case 1:
                return this.state.currentLevel[this.state.gubbeY - 1][this.state.gubbeX];            
            case 2:
                return this.state.currentLevel[this.state.gubbeY][this.state.gubbeX + 1];
            case 3:
                return this.state.currentLevel[this.state.gubbeY + 1][this.state.gubbeX];            
            default:
                break;
        }
        return false;
    }

    checkZombieCollision = (zombie) => {
        return this.state.currentLevel[zombie.zombieY][zombie.zombieX];
    }

    checkGubbeVsZombie = (zombie) => {
        if (this.state.gubbeX === zombie.zombieX && this.state.gubbeY === zombie.zombieY) {
            if (!this.state.inventory.includes('shield')) {
                this.gubbeDied();
            } else {
                this.setState({ shieldHealth: this.state.shieldHealth - .2 });
                this.playSoundEffect(shieldUse);
                if (this.state.shieldHealth < 0) this.setState({ inventory: this.state.inventory.filter(item => item !== 'shield') })
            }
        }
    }

    checkGubbeVsBullet = (bullet) => {
        if (this.state.gubbeX === bullet.bulletX && this.state.gubbeY === bullet.bulletY) {
            if (!this.state.inventory.includes('shield')) {
                this.gubbeDied();
            } else {
                this.setState({ shieldHealth: this.state.shieldHealth - .2 });
                this.playSoundEffect(shieldUse);
                if (this.state.shieldHealth < 1) this.setState({ inventory: this.state.inventory.filter(item => item !== 'shield') })
            }
        }
    }

    fireGun = () => {
        if (!this.state.inventory.includes('gun')) return false;
        this.setState({ gunBullets: [...this.state.gunBullets, { bulletX: null, bulletY: null, moving: false }]})
    }

    removeLaser = () => {
        const level = this.state.currentLevel.map((line, y) => line.map((block, x) => {
            if (block === 15) return 0;
            return block;
        }));
        this.setState({ currentLevel: level });
    }

    gubbeDied = () => {
        this.playSoundEffect(gubbeDie);
        this.setState({ message: 'död', gubbeLocked: true, lives: this.state.lives - 1  });
        if (this.state.lives < 1) {
            this.setState({ message: 'gameover' });
            setTimeout(() => {
                this.gameover();
            }, 4000)
        } else {
            setTimeout(() => {
                this.reset();
            }, 2000)    
        }
    }

    findPortalAndTeleport = (direction) => {
        let currentPortal = [0, 0];
        switch (direction) {
            case 0:
                currentPortal = [this.state.gubbeY, this.state.gubbeX - 1];
                break;
            case 1:
                currentPortal = [this.state.gubbeY - 1, this.state.gubbeX];
                break;
            case 2:
                currentPortal = [this.state.gubbeY, this.state.gubbeX + 1];
                break;
            case 3:
                currentPortal = [this.state.gubbeY + 1, this.state.gubbeX];
                break;
            default:
                break;
        }
        const portalIndices = this.getIndexOfK(this.state.currentLevel, 8);
        const newPosition = portalIndices.find(index => JSON.stringify(index) !== JSON.stringify(currentPortal));
        this.setState({ gubbeY: newPosition[0], gubbeX: newPosition[1] });
    }

    setBombActive = () => {
        this.setState({ bombActive: true });
        this.playSoundEffect(bomb);
        setTimeout(() => {
            const bombCoordinates = this.getIndexOfK(this.state.currentLevel, 17);
            const level = this.state.currentLevel.map((line, y) => line.map((block, x) => {
                const bombDistanceX = Math.abs(bombCoordinates[0][1] - x);
                const bombDistanceY = Math.abs(bombCoordinates[0][0] - y);

                if (bombDistanceX < 2 && bombDistanceY < 2 && block !== 0) return 11;
                return block;
            }));
            this.playSoundEffect(explosion);
            this.setState({ currentLevel: level, bombActive: false });
        }, 4000)
    }

    getIndexOfK(arr, k) {
        const indices = [];
        for (let row = 0; row < arr.length; row++) {
            for (let char = 0; char < arr[row].length; char++) {
                if (arr[row][char] === k) indices.push([row, char]);
            }
        }
        return indices;
    }

    toggleMusic = () => {
        this.setState({ music: !this.state.music }, () => {
            if (!this.state.music) {
                music.pause();
            } else {
                music.play();
            }
        });
    }

    toggleSoundEffects = () => {
        this.setState({ soundEffects: !this.state.soundEffects });
    }

    playSoundEffect(effect) {
        if (this.state.soundEffects) {
            effect.play();
        } 
    }
    setBoardXYAs(newItem) {
        let indexToUpdate = null;
        switch (this.state.gubbeDirection) {
            case 0:
                indexToUpdate = [this.state.gubbeY, this.state.gubbeX - 1];
                break;
            case 1:
                indexToUpdate = [this.state.gubbeY - 1, this.state.gubbeX];
                break;
            case 2:
                indexToUpdate = [this.state.gubbeY, this.state.gubbeX + 1];
                break;
            case 3:
                indexToUpdate = [this.state.gubbeY + 1, this.state.gubbeX];
                break;
            default:
                break;
        }
        const level = this.state.currentLevel.map((line, y) => line.map((block, x) => {
            if (indexToUpdate[0] === y && indexToUpdate[1] === x) return newItem;
            return block;
        }));
        this.setState({ currentLevel: level });
    }

    moveGubbe = (direction) => {
        if (this.state.gubbeLocked) return;
        this.setState({ gubbeDirection: direction }, () => {
            if (this.checkGubbeCollision(direction) === 2) {
                this.setState({ inventory: [...this.state.inventory, 'key'], points: this.state.points + 5 });
                this.setBoardXYAs(0);
                this.playSoundEffect(key);
            }
            if (this.checkGubbeCollision(direction) === 24) {
                this.setState({ inventory: [...this.state.inventory, 'gun'], points: this.state.points + 5 });
                this.setBoardXYAs(0);
                this.playSoundEffect(getGun);
            }
            if (this.checkGubbeCollision(direction) === 19) {
                this.setState({ inventory: [...this.state.inventory, 'hacka'], points: this.state.points + 5, hackaHealth: 1 });
                this.setBoardXYAs(0);
                this.playSoundEffect(key);
            }
            if (this.checkGubbeCollision(direction) === 22) {
                this.setState({ inventory: [...this.state.inventory, 'fackla'], points: this.state.points + 5 });
                setTimeout(() => {
                    this.setState({ inventory: this.state.inventory.filter(item => item !== 'fackla')});
                }, 15000);
                this.setBoardXYAs(0);
                this.playSoundEffect(fire);
            }
            if ([5, 6, 7, 9].includes(this.checkGubbeCollision(direction)) && this.state.inventory.includes('hacka')) {
                this.setState({ hackaHealth: this.state.hackaHealth - .25 }, () => {
                    if (this.state.hackaHealth < 0) this.setState({ inventory: this.state.inventory.filter(item => item !== 'hacka')}); 
                });
                this.setBoardXYAs(0);
                this.playSoundEffect(explosion);
            }
            if (this.checkGubbeCollision(direction) === 11) {
                this.setState({ points: this.state.points + 3 });
                this.setBoardXYAs(0);
                this.playSoundEffect(peng);
            }
            if (this.checkGubbeCollision(direction) === 12) {
                this.setState({ lives: this.state.lives + 1 });
                this.setBoardXYAs(0);
                this.playSoundEffect(powerup);
            }
            if (this.checkGubbeCollision(direction) === 13) {
                if (this.state.inventory.includes('shield')) {
                    this.setState({ points: this.state.points + 10, shieldHealth: 1 });
                } else {
                    this.setState({ inventory: [...this.state.inventory, 'shield'], points: this.state.points + 10, shieldHealth: 1 });
                }
                this.setBoardXYAs(0);
                this.playSoundEffect(shield);
            }
            if (this.checkGubbeCollision(direction) === 15) {
                this.gubbeDied();
            }
            if (this.checkGubbeCollision(direction) === 16) {
                this.removeLaser();
                this.playSoundEffect(laser);
            }
            if (this.checkGubbeCollision(direction) === 17) {
                this.setBombActive();
                this.playSoundEffect(laser);
            }
            if (this.checkGubbeCollision(direction) === 3 && !this.state.inventory.includes('key')) {
                this.playSoundEffect(noKey);
                return;
            }
            if (this.checkGubbeCollision(direction) === 8) {
                this.findPortalAndTeleport(direction);
                this.playSoundEffect(portal);
            }
            if (this.checkGubbeCollision(direction) === 3 && this.state.inventory.includes('key')) {
                this.setState({ doorOpen: true });
                this.playSoundEffect(win);
                this.setState({ message: 'vann', level: this.state.level + 1, points: this.state.points + 10, gubbeLocked: true}, () => {
                    if (this.state.level >= levels.length) {
                        music.pause();
                        this.props.finishGame();
                    } else {
                        setTimeout(() => {
                            this.reset();
                        }, 2000);    
                    }
                })
            }
        });
        switch (direction) {
            case 0:
                if (![1, 4, 5, 6, 7, 8, 9, 14, 17].includes(this.checkGubbeCollision(direction)) && this.state.gubbeX > 0) {
                    this.setState({ gubbeX: this.state.gubbeX - 1 });
                }
                break;
            case 1:
                if (![1, 4, 5, 6, 7, 8, 9, 14, 17].includes(this.checkGubbeCollision(direction)) && this.state.gubbeY > 1) {
                    this.setState({ gubbeY: this.state.gubbeY - 1 });                    
                }
                break;
            case 2:
                if (![1, 4, 5, 6, 7, 8, 9, 14, 17].includes(this.checkGubbeCollision(direction)) && this.state.gubbeX < 23) {
                    this.setState({ gubbeX: this.state.gubbeX + 1 });
                }
                break;
            case 3:
                if (![1, 4, 5, 6, 7, 8, 9, 14, 17].includes(this.checkGubbeCollision(direction)) && this.state.gubbeY < 10) {
                    this.setState({ gubbeY: this.state.gubbeY + 1 });
                }
                break;
            default:
                break;
        }
        this.state.zombies.map(zombie => {
            this.checkGubbeVsZombie(zombie);
        });
    }

    zombieMove = () => {
        if (this.state.gubbeLocked) return;
        const zombies = [...this.state.zombies];
        const newZombies = zombies.map(zombie => {
            const matrix = this.state.currentLevel.map(row => row.map(b => [0, 15].includes(b) ? 0 : 1));
            const grid = new PF.Grid(matrix);
            const finder = new PF.AStarFinder();
            const path = finder.findPath(zombie.zombieX, zombie.zombieY, this.state.gubbeX, this.state.gubbeY, grid);
            if (path.length > 1) {
                if (zombie.zombieX > path[1][0]) zombie.zombieDirection = 0;
                if (zombie.zombieX < path[1][0]) zombie.zombieDirection = 2;
                if (zombie.zombieY > path[1][1]) zombie.zombieDirection = 1;
                if (zombie.zombieY < path[1][1]) zombie.zombieDirection = 3;
                zombie.zombieX = path[1][0];
                zombie.zombieY = path[1][1];    
            }
            this.checkGubbeVsZombie(zombie);
            if(this.checkZombieCollision(zombie) === 15) {
                this.playSoundEffect(skott);
                return null;
            }
            return zombie;
        })
        this.setState({ zombies: newZombies.filter(z => z !== null) });
    }

    checkZombiesVsBullet = (bullet) => {
        const newZombies = this.state.zombies.map(zombie => {
            if (!(zombie.zombieX === bullet.bulletX && zombie.zombieY === bullet.bulletY)) {
                return zombie;
            } else {
                this.playSoundEffect(skott);
                return null;
            }
        });
        this.setState({ zombies: newZombies.filter(z => z !== null) });
    }


    bulletsMove = () => {
        if (this.state.gubbeLocked || this.getIndexOfK(this.state.currentLevel, 18).length === 0) return;
        const newBullets = [...this.state.bullets];
        newBullets.map(bullet => {
            if (!bullet.moving) {
                bullet.bulletX = bullet.initialX;
                bullet.bulletY = bullet.initialY + 1;
                bullet.moving = true;
            }
            this.checkZombiesVsBullet(bullet);
            this.checkGubbeVsBullet(bullet);
            if (this.state.currentLevel[bullet.bulletY + 1][bullet.bulletX] === 0) {
                bullet.bulletY = bullet.bulletY + 1;
            } else {
                bullet.moving = false;
            }    
        });
    }

    gunBulletsMove = () => {
        if (this.state.gubbeLocked || !this.state.inventory.includes('gun')) return;
        const newBullets = [...this.state.gunBullets];
        newBullets.map(bullet => {
            if (!bullet.moving) {
                this.playSoundEffect(skott);
                bullet.bulletX = this.state.gubbeX;
                bullet.bulletY = this.state.gubbeY;
                bullet.moving = true;
            }
            this.checkZombiesVsBullet(bullet);
            switch (this.state.gubbeDirection) {
                case 0:
                    if (this.state.currentLevel[bullet.bulletY][bullet.bulletX - 1] === 0) {
                        bullet.bulletX = bullet.bulletX - 1;
                    } else {
                        bullet.moving = false;
                    }    
                    break;
                case 1:
                    if (this.state.currentLevel[bullet.bulletY - 1][bullet.bulletX] === 0) {
                        bullet.bulletY = bullet.bulletY - 1;
                    } else {
                        bullet.moving = false;
                    }
                    break;
                case 2:
                    if (this.state.currentLevel[bullet.bulletY][bullet.bulletX + 1] === 0) {
                        bullet.bulletX = bullet.bulletX + 1;
                    } else {
                        bullet.moving = false;
                    }
                    break;
                case 3:
                    if (this.state.currentLevel[bullet.bulletY + 1][bullet.bulletX] === 0) {
                        bullet.bulletY = bullet.bulletY + 1;
                    } else {
                        bullet.moving = false;
                    }
                    break;
                default:
                    break;
            }
            this.setState({ gunBullets: newBullets.filter(bullet => bullet.moving !== false) });  
        });
    }

    render() {
        const level = this.state.currentLevel.map((line, y) => line.map((block, x) => 
            <Block 
                doorOpen={this.state.doorOpen}
                bombActive={this.state.bombActive}
                key={x+y}
                x={x}
                y={y}
                block={block}
                hasFackla={this.state.inventory.includes('fackla')}
                gubbeX={this.state.gubbeX}
                gubbeY={this.state.gubbeY} 
            />));
        const inventory = {
            'key': <img key="key" alt="" className="key" src={nyckelImage}/>,
            'shield': <img style={{ opacity: this.state.shieldHealth }} key="shield" alt="" className="key" src={shieldImage}/>,
            'hacka': <img style={{ opacity: this.state.hackaHealth }} key="hacka" alt="" className="key" src={hackaImage}/>,
            'fackla': <img key="fackla" alt="" className="key" src={facklaImage}/>,
            'gun': <img key="gun" alt="" className="key" src={gunImage}/>

        };

        const bullets = this.state.bullets.map((b, i) =>
            <Skott key={i} gubbeX={this.state.gubbeX} gubbeY={this.state.gubbeY} skottX={b.bulletX} skottY={b.bulletY} />
        )
        const gunBullets = this.state.gunBullets.map((b, i) =>
        <Skott key={i} gubbeX={this.state.gubbeX} gubbeY={this.state.gubbeY} skottX={b.bulletX} skottY={b.bulletY} />
    )
        const zombies = this.state.zombies.map((z, i) => 
            <Zombie
                key={i}
                hasFackla={this.state.inventory.includes('fackla')}
                zombieX={z.zombieX}
                zombieY={z.zombieY}
                isMonster={z.isMonster}
                gubbeX={this.state.gubbeX}
                gubbeY={this.state.gubbeY}
                zombieDirection={z.zombieDirection} />)
        return (
            <div className="App">
                <header>
                    <div>
                        <h1>Labyrinten</h1>
                        <h3>av Olle Kanarp</h3>
                    </div>
                    <div className="info">
                        <span>Styr med piltangenterna ⬆️ ⬇️ ➡️ ⬅️</span>
                        <span>Hitta nyckeln 🗝 och öppna dörren</span>
                        <span onClick={this.toggleMusic}>Musik {this.state.music ? 'på' : 'av'}</span>
                        <span onClick={this.toggleSoundEffects}>Ljudeffekter {this.state.soundEffects ? 'på' : 'av'}</span>

                    </div>
                    <div className="info">
                        <span>Poäng: {this.state.points}</span>
                        <span>Nivå: {this.state.level + 1}</span>
                        <span>Liv: {this.state.lives}</span>
                        <span>Ryggsäck: {this.state.inventory.map(item => inventory[item])}</span>
                        
                    </div>
                </header>
                <div className="level">
                    {level}
                    <Gubbe
                        gubbeX={this.state.gubbeX}
                        gubbeY={this.state.gubbeY}
                        gubbeDirection={this.state.gubbeDirection}
                        hasFackla={this.state.inventory.includes('fackla')}
                        shieldHealth={this.state.shieldHealth}
                        hasShield={this.state.inventory.includes('shield')} />
                    {zombies}
                    {bullets}
                    {gunBullets}
                </div>
            <InfoMessage message={this.state.message} />
            </div>)
    }
}

export default GameEngine;
