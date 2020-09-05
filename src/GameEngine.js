import React from 'react';
import PF from 'pathfinding';
import './GameEngine.css';
import { handleTouchStart, handleTouchMove } from './Touch';
import Gubbe from './Gubbe';
import Zombie from './Zombie';
import Block from './Block';
import nyckelImage from './assets/nyckel.png';
import shieldImage from './assets/sköld.png';
import hackaImage from './assets/hacka.png';
import facklaImage from './assets/fackla.png';
import Skott from './Skott';
import InfoMessage from './InfoMessage';
import { gubbeDie, peng, key, shield, powerup, portal, win, laser, noKey, music, bomb, explosion, fire, shieldUse } from './Audio';
import levels from '../src/Levels';

const initialState = {
    gubbeDirection: 1,
    zombies: [],
    zombieSteps: 0,
    gubbeLocked: false,
    inventory: [],
    doorOpen: false,
    hackaHealth: 1,
    shieldHealth: 1,
    bombActive: false,
    message: '',
    bulletMoving: false
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
            bulletX: null,
            bulletY: null
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
            bulletX: null,
            bulletY: null
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
            bulletX: null,
            bulletY: null
        });
    }

    componentDidMount() {
        document.addEventListener('keyup', this.keyBoard, false);
        document.addEventListener('touchstart', handleTouchStart, false);        
        document.addEventListener('touchmove', (e) => {
            handleTouchMove(e, this.moveGubbe);
        }, false);
        music.loop = true;
        this.zombieTimer = setInterval(() => {
            this.zombieMove();
        }, 1500);
        this.gunTimer = setInterval(() => {
            this.gunMove();
        }, 200);
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
        document.removeEventListener('keyup', this.keyBoard, false);
        document.removeEventListener('touchstart', handleTouchStart, false);
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

    checkZombieCollision = (zombie, direction) => {
        switch (direction) {
            case 0:
                if ([0, 11, 12, 13, 16, 20, 21].includes(this.state.currentLevel[zombie.zombieY][zombie.zombieX - 1])) return true;
                break;
            case 1:
                if ([0, 11, 12, 13, 16, 20, 21].includes(this.state.currentLevel[zombie.zombieY - 1][zombie.zombieX])) return true;
                break;
            case 2:
                if ([0, 11, 12, 13, 16, 20, 21].includes(this.state.currentLevel[zombie.zombieY][zombie.zombieX + 1])) return true;
                break;
            case 3:
                if ([0, 11, 12, 13, 16, 20, 21].includes(this.state.currentLevel[zombie.zombieY + 1][zombie.zombieX])) return true;
                break;
            default:
                break;
        }
        return false;
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

    checkGubbeVsBullet = () => {
        if (this.state.gubbeX === this.state.bulletX && this.state.gubbeY === this.state.bulletY) {
            if (!this.state.inventory.includes('shield')) {
                this.gubbeDied();
            } else {
                this.setState({ shieldHealth: this.state.shieldHealth - .2 });
                this.playSoundEffect(shieldUse);
                if (this.state.shieldHealth < 1) this.setState({ inventory: this.state.inventory.filter(item => item !== 'shield') })
            }
        }
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
        let indices = [];
        for (var i = 0; i < arr.length; i++) {
            var index = arr[i].indexOf(k);
            if (index > -1) {
              indices.push([i, index]);
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
            const matrix = this.state.currentLevel.map(row => row.map(b => b === 0 ? 0 : 1));
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
            return zombie;
        })
        this.setState({ zombies: newZombies });
    }

    checkZombiesVsBullet = () => {
        const newZombies = this.state.zombies.map(zombie => {
            if (!(zombie.zombieX === this.state.bulletX && zombie.zombieY === this.state.bulletY)) {
                return zombie;
            } else {
                return null;
            }
        });
        this.setState({ zombies: newZombies.filter(z => z !== null) });
    }


    gunMove = () => {
        if (this.state.gubbeLocked || this.getIndexOfK(this.state.currentLevel, 18).length === 0) return;
        if (this.state.bulletMoving === false) {
            const bulletCoordinates = this.getIndexOfK(this.state.currentLevel, 18);
            this.setState({ bulletMoving: true, bulletX: bulletCoordinates[0][1], bulletY: bulletCoordinates[0][0] });
        }
        if (this.state.bulletMoving) {
            this.checkZombiesVsBullet();
            this.checkGubbeVsBullet();
            if (this.state.currentLevel[this.state.bulletY + 1][this.state.bulletX] === 0) {
                this.setState({ bulletY: this.state.bulletY + 1 });
            } else {
                this.setState({ bulletMoving: false });
            }
        }

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
            'fackla': <img key="fackla" alt="" className="key" src={facklaImage}/>
        };
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
                    {this.state.bulletMoving && <Skott gubbeX={this.state.gubbeX} gubbeY={this.state.gubbeY} skottX={this.state.bulletX} skottY={this.state.bulletY} />}
                </div>
            <InfoMessage message={this.state.message} />
            </div>)
    }
}

export default GameEngine;
