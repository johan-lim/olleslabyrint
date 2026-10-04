import React, { useEffect, useRef, useState } from 'react';
import levels from './Levels';
import wall1 from './assets/block1.png';
import wall2 from './assets/block2.png';
import wall3 from './assets/block3.png';
import wall4 from './assets/block4.png';
import wall5 from './assets/block5.png';
import wall6 from './assets/block6.png';
import door from './assets/dörr.png';
import openDoor from './assets/dörr-open.png';
import rock from './assets/rock.png';
import sand from './assets/sand.png';
import keyImage from './assets/nyckel.png';
import laserImage from './assets/laser.png';
import switchImage from './assets/knapp.png';
import portalImage from './assets/portal.png';
import coinImage from './assets/peng.png';
import extraLifeImage from './assets/extraliv.png';
import shieldImage from './assets/sköld.png';
import cannonImage from './assets/kanon.png';
import bombImage from './assets/bomb.png';
import cannonTwoImage from './assets/kanon2.png';
import cannonballImage from './assets/skott.png';
import pickaxeImage from './assets/hacka.png';
import torchImage from './assets/fackla.png';
import zombieImage from './assets/zombie.png';
import lavaMonsterImage from './assets/lavamonster.png';
import gunImage from './assets/gun.png';
import playerImage from './assets/gubbe.png';
import gameOverImage from './assets/gameover.png';
import successImage from './assets/slutskärm.png';
import {
  bomb as bombSound,
  explosion,
  endMusic,
  gubbeDie,
  fire,
  getGun as getGunSound,
  key as keySound,
  laser as laserSound,
  newGame,
  noKey,
  peng,
  portal as portalSound,
  powerup as powerupSound,
  shield as shieldSound,
  shieldUse,
  skott as cannonSound,
  win,
} from './Audio';
import './RaycastGame.css';

const FIELD_OF_VIEW = Math.PI / 3;
const BASE_VIEW_DISTANCE = 8;
const TORCH_VIEW_DISTANCE = 11;
const TORCH_DURATION_MS = 15000;
const BOMB_COUNTDOWN_MS = 4000;
const CANNON_STEP_MS = 600;
const CANNON_MOVE_MS = 500;
const SOUND_FALLOFF_DISTANCE = 12;
const GUN_EFFECT_MS = 120;
const ZOMBIE_STEP_MS = 1500;
const ZOMBIE_MOVE_MS = 700;
const SHIELD_HIT_COOLDOWN_MS = 650;
const PLAYER_RADIUS = 0.2;
const MOVE_SPEED = 2.35;
const TURN_SPEED = 2.15;
const WORLD_SPRITE_SCALE = 0.5;
const SOLID_TILES = new Set([1, 3, 4, 5, 6, 7, 9, 25, 26]);
const textureSources = {
  1: wall1, 3: door, 4: wall2, 5: wall3, 6: wall4,
  7: wall5, 9: wall6, 25: rock, 26: sand,
};
const MINIMAP_SPRITES = {
  2: keyImage,
  3: door,
  8: portalImage,
  11: coinImage,
  12: extraLifeImage,
  13: shieldImage,
  14: cannonImage,
  15: laserImage,
  16: switchImage,
  17: bombImage,
  18: cannonTwoImage,
  19: pickaxeImage,
  21: zombieImage,
  22: torchImage,
  23: lavaMonsterImage,
  24: gunImage,
  25: rock,
  26: sand,
};

function playSound(sound, volume = 1) {
  sound.volume = Math.max(0, Math.min(1, volume));
  sound.currentTime = 0;
  const playback = sound.play();
  if (playback && playback.catch) playback.catch(() => {});
}

function playSoundAt(sound, sourceX, sourceY, listener) {
  const distance = Math.hypot(sourceX - listener.x, sourceY - listener.y);
  const proximity = Math.max(0, 1 - distance / SOUND_FALLOFF_DISTANCE);
  playSound(sound, proximity * proximity);
}

function findStart(map) {
  for (let y = 0; y < map.length; y += 1) {
    const x = map[y].indexOf(20);
    if (x !== -1) {
      const startX = x + 0.5;
      const startY = y + 0.5;
      const directions = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
      const angle = directions.reduce((bestAngle, candidateAngle) => (
        castRay(map, startX, startY, candidateAngle).distance >
          castRay(map, startX, startY, bestAngle).distance
          ? candidateAngle
          : bestAngle
      ), directions[0]);
      return { x: startX, y: startY, angle };
    }
  }
  return { x: 1.5, y: 1.5, angle: 0 };
}

function findTiles(map, tileType) {
  const matches = [];
  map.forEach((row, y) => row.forEach((tile, x) => {
    if (tile === tileType) matches.push({ id: `${x}-${y}`, x: x + 0.5, y: y + 0.5 });
  }));
  return matches;
}

function createCannonballs(map) {
  return findTiles(map, 18).map((cannon) => ({
    id: `shot-${cannon.id}`,
    originX: cannon.x,
    originY: cannon.y,
    x: cannon.x,
    y: cannon.y,
    fromX: cannon.x,
    fromY: cannon.y,
    targetX: cannon.x,
    targetY: cannon.y,
    moveStartedAt: 0,
    moveEndsAt: 0,
    impacting: false,
    moving: false,
  }));
}

function createZombies(map) {
  return findTiles(map, 21).map((zombie) => ({
    ...zombie,
    initialX: zombie.x,
    initialY: zombie.y,
    fromX: zombie.x,
    fromY: zombie.y,
    targetX: zombie.x,
    targetY: zombie.y,
    moveStartedAt: 0,
    moveEndsAt: 0,
  }));
}

function findGridPath(map, start, goal, isWalkable) {
  const startId = `${start.x}-${start.y}`;
  const goalId = `${goal.x}-${goal.y}`;
  if (startId === goalId) return [start];
  if (!isWalkable(goal.x, goal.y)) return [];
  const queue = [start];
  const parents = new Map([[startId, null]]);
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    const neighbors = [
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y - 1 },
      { x: current.x + 1, y: current.y },
      { x: current.x, y: current.y + 1 },
    ];
    for (const neighbor of neighbors) {
      const id = `${neighbor.x}-${neighbor.y}`;
      if (parents.has(id) || !map[neighbor.y] || map[neighbor.y][neighbor.x] === undefined ||
        !isWalkable(neighbor.x, neighbor.y)) continue;
      parents.set(id, current);
      if (id === goalId) {
        const path = [neighbor];
        let cursor = current;
        while (cursor) {
          path.unshift(cursor);
          cursor = parents.get(`${cursor.x}-${cursor.y}`);
        }
        return path;
      }
      queue.push(neighbor);
    }
  }
  return [];
}

function laserAngles(map, x, y) {
  const isLaserPath = (tile) => tile === 14 || tile === 15 || tile === 18;
  const horizontal = isLaserPath(map[y] && map[y][x - 1]) ||
    isLaserPath(map[y] && map[y][x + 1]);
  const vertical = isLaserPath(map[y - 1] && map[y - 1][x]) ||
    isLaserPath(map[y + 1] && map[y + 1][x]);
  if (horizontal && vertical) return [0, 90];
  if (vertical) return [90];
  return [0];
}

function tileAt(map, x, y) {
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);
  if (!map[tileY] || map[tileY][tileX] === undefined) return 1;
  return map[tileY][tileX];
}

function isSolid(map, x, y, doorOpen) {
  const tile = tileAt(map, x, y);
  if (tile === 14 || tile === 17) return true;
  return SOLID_TILES.has(tile) && !(tile === 3 && doorOpen);
}

function canStand(map, x, y, doorOpen) {
  return !isSolid(map, x - PLAYER_RADIUS, y - PLAYER_RADIUS, doorOpen) &&
    !isSolid(map, x + PLAYER_RADIUS, y - PLAYER_RADIUS, doorOpen) &&
    !isSolid(map, x - PLAYER_RADIUS, y + PLAYER_RADIUS, doorOpen) &&
    !isSolid(map, x + PLAYER_RADIUS, y + PLAYER_RADIUS, doorOpen);
}

function castRay(map, originX, originY, angle) {
  const rayX = Math.cos(angle);
  const rayY = Math.sin(angle);
  let mapX = Math.floor(originX);
  let mapY = Math.floor(originY);
  const deltaX = Math.abs(1 / (rayX || 0.000001));
  const deltaY = Math.abs(1 / (rayY || 0.000001));
  const stepX = rayX < 0 ? -1 : 1;
  const stepY = rayY < 0 ? -1 : 1;
  let sideX = rayX < 0 ? (originX - mapX) * deltaX : (mapX + 1 - originX) * deltaX;
  let sideY = rayY < 0 ? (originY - mapY) * deltaY : (mapY + 1 - originY) * deltaY;
  let side = 0;
  let tile = 0;
  let laserDistance = null;

  while (tile === 0) {
    let enteredDistance;
    if (sideX < sideY) {
      enteredDistance = sideX;
      sideX += deltaX;
      mapX += stepX;
      side = 0;
    } else {
      enteredDistance = sideY;
      sideY += deltaY;
      mapY += stepY;
      side = 1;
    }
    if (!map[mapY] || map[mapY][mapX] === undefined) tile = 1;
    else {
      const enteredTile = map[mapY][mapX];
      if (enteredTile === 15 && laserDistance === null) laserDistance = enteredDistance;
      if (SOLID_TILES.has(enteredTile)) tile = enteredTile;
    }
  }

  const distance = side === 0
    ? (mapX - originX + (1 - stepX) / 2) / rayX
    : (mapY - originY + (1 - stepY) / 2) / rayY;
  const hit = side === 0 ? originY + distance * rayY : originX + distance * rayX;
  let textureX = hit - Math.floor(hit);
  if ((side === 0 && rayX > 0) || (side === 1 && rayY < 0)) textureX = 1 - textureX;
  return { distance: Math.abs(distance), side, textureX, tile, laserDistance };
}

function traceGunShot(map, player, targets = [], isPassable = () => true) {
  const wallHit = castRay(map, player.x, player.y, player.angle);
  const cells = [];
  const visited = new Set();
  let hitTarget = null;
  let impactDistance = wallHit.distance;
  for (let distance = 0.1; distance < wallHit.distance; distance += 0.04) {
    const x = player.x + Math.cos(player.angle) * distance;
    const y = player.y + Math.sin(player.angle) * distance;
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    const cellId = `${cellX}-${cellY}`;
    if (!visited.has(cellId)) {
      visited.add(cellId);
      cells.push({ x: cellX, y: cellY });
      hitTarget = targets.find((target) =>
        Math.floor(target.x) === cellX && Math.floor(target.y) === cellY
      ) || null;
      if (hitTarget) {
        impactDistance = distance;
        break;
      }
      if (!isPassable(cellX, cellY)) {
        impactDistance = distance;
        break;
      }
    }
  }
  return { cells, hitTarget, distance: impactDistance };
}

function MiniMap({
  map, player, doorOpen, collectedKeys, collectedCoins, collectedHearts,
  collectedTorches, collectedGuns, collectedShields, collectedPickaxes,
  zombies, lasersActive, activeBombId,
}) {
  const width = map[0].length;
  const height = map.length;
  const playerRotation = (player.angle * 180) / Math.PI + 90;
  return (
    <aside className="minimap" aria-label="Map showing walls and player position">
      <p>MAP</p>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}
        role="img" aria-label="Current level map">
        <rect width={width} height={height} className="minimap-background" />
        {map.map((row, y) => row.map((tile, x) => (
          SOLID_TILES.has(tile)
            ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1"
              className={tile === 3 && doorOpen ? 'minimap-door-open' : 'minimap-wall'} />
            : null
        )))}
        {map.map((row, y) => row.map((tile, x) => {
          if (tile === 2 && collectedKeys.has(`${x}-${y}`)) return null;
          if (tile === 11 && collectedCoins.has(`${x}-${y}`)) return null;
          if (tile === 12 && collectedHearts.has(`${x}-${y}`)) return null;
          if (tile === 13 && collectedShields.has(`${x}-${y}`)) return null;
          if (tile === 19 && collectedPickaxes.has(`${x}-${y}`)) return null;
          if (tile === 22 && collectedTorches.has(`${x}-${y}`)) return null;
          if (tile === 24 && collectedGuns.has(`${x}-${y}`)) return null;
          if (tile === 21) return null;
          if (tile === 15 && !lasersActive) return null;
          if (tile === 10) {
            return <rect key={`item-${x}-${y}`} x={x + 0.12} y={y + 0.12}
              width="0.76" height="0.76" className="minimap-outline-block" />;
          }
          if (tile === 15) {
            return <g key={`item-${x}-${y}`}>
              {laserAngles(map, x, y).map((angle) => (
                <image key={angle} href={laserImage} x={x + 0.08} y={y + 0.08}
                  width="0.84" height="0.84" preserveAspectRatio="xMidYMid meet"
                  transform={angle ? `rotate(${angle} ${x + 0.5} ${y + 0.5})` : undefined}
                  className="minimap-sprite" />
              ))}
            </g>;
          }
          const source = tile === 3 && doorOpen ? openDoor : MINIMAP_SPRITES[tile];
          if (!source) return null;
          return <image key={`item-${x}-${y}`} href={source} x={x + 0.08} y={y + 0.08}
            width="0.84" height="0.84" preserveAspectRatio="xMidYMid meet"
            className={`minimap-sprite ${tile === 17 && activeBombId === `${x}-${y}` ? 'bomb-active' : ''}`} />;
        }))}
        {zombies.map((zombie) => (
          <image key={`zombie-${zombie.id}`} href={zombieImage}
            x={zombie.x - 0.42} y={zombie.y - 0.42} width="0.84" height="0.84"
            preserveAspectRatio="xMidYMid meet" className="minimap-sprite" />
        ))}
        <image href={playerImage} x={player.x - 0.42} y={player.y - 0.3}
          width="0.84" height="0.6" preserveAspectRatio="xMidYMid meet"
          transform={`rotate(${playerRotation} ${player.x} ${player.y})`}
          className="minimap-sprite minimap-player-sprite" />
      </svg>
    </aside>
  );
}

function Inventory({ keyCount, torchRemaining, hasGun, shieldHealth, pickaxeHealth }) {
  return (
    <aside className="inventory" aria-label={`Inventory with ${keyCount} keys`}>
      <p>INVENTORY</p>
      <div className={`inventory-slot ${keyCount === 0 ? 'empty' : ''}`}>
        {keyCount > 0 && <img src={keyImage} alt="Key" />}
        <span>{keyCount}</span>
      </div>
      <div className={`inventory-slot torch-slot ${torchRemaining === 0 ? 'empty' : 'torch-active'}`}>
        {torchRemaining > 0 && <img src={torchImage} alt="Torch" />}
        <span>{torchRemaining > 0 ? `${Math.ceil(torchRemaining)}s` : '0'}</span>
      </div>
      <div className={`inventory-slot ${hasGun ? '' : 'empty'}`}>
        {hasGun && <img src={gunImage} alt="Gun" />}
        <span>{hasGun ? 'READY' : '0'}</span>
      </div>
      <div className={`inventory-slot ${shieldHealth > 0 ? 'shield-active' : 'empty'}`}>
        {shieldHealth > 0 && <img src={shieldImage} alt="Shield"
          style={{ opacity: 0.35 + shieldHealth * 0.65 }} />}
        <span>{shieldHealth > 0 ? `${Math.round(shieldHealth * 100)}%` : '0'}</span>
      </div>
      <div className={`inventory-slot ${pickaxeHealth > 0 ? 'pickaxe-active' : 'empty'}`}>
        {pickaxeHealth > 0 && <img src={pickaxeImage} alt="Pickaxe"
          style={{ opacity: 0.35 + pickaxeHealth * 0.65 }} />}
        <span>{pickaxeHealth > 0 ? Math.ceil(pickaxeHealth * 4) : '0'}</span>
      </div>
    </aside>
  );
}

function RaycastGame() {
  const initialMap = levels[0].blocks;
  const canvasRef = useRef(null);
  const playerRef = useRef(findStart(initialMap));
  const keysRef = useRef(new Set());
  const levelSkipRequestedRef = useRef(false);
  const levelSkipHeldRef = useRef(false);
  const restartRequestedRef = useRef(false);
  const fireRequestedRef = useRef(false);
  const texturesRef = useRef({});
  const spriteTexturesRef = useRef({});
  const portalFrameRef = useRef(null);
  const mapRef = useRef(initialMap);
  const levelIndexRef = useRef(0);
  const keyItemsRef = useRef(findTiles(initialMap, 2));
  const coinItemsRef = useRef(findTiles(initialMap, 11));
  const heartItemsRef = useRef(findTiles(initialMap, 12));
  const shieldItemsRef = useRef(findTiles(initialMap, 13));
  const pickaxeItemsRef = useRef(findTiles(initialMap, 19));
  const torchItemsRef = useRef(findTiles(initialMap, 22));
  const doorItemsRef = useRef(findTiles(initialMap, 3));
  const laserItemsRef = useRef(findTiles(initialMap, 15));
  const switchItemsRef = useRef(findTiles(initialMap, 16));
  const portalItemsRef = useRef(findTiles(initialMap, 8));
  const bombItemsRef = useRef(findTiles(initialMap, 17));
  const gunItemsRef = useRef(findTiles(initialMap, 24));
  const cannonItemsRef = useRef(findTiles(initialMap, 14));
  const cannonEmitterItemsRef = useRef(findTiles(initialMap, 18));
  const cannonballsRef = useRef(createCannonballs(initialMap));
  const zombieItemsRef = useRef(createZombies(initialMap));
  const nextCannonStepRef = useRef(0);
  const nextZombieStepRef = useRef(0);
  const collectedKeysRef = useRef(new Set());
  const collectedCoinsRef = useRef(new Set());
  const collectedHeartsRef = useRef(new Set());
  const collectedShieldsRef = useRef(new Set());
  const collectedPickaxesRef = useRef(new Set());
  const collectedTorchesRef = useRef(new Set());
  const collectedGunsRef = useRef(new Set());
  const keyCountRef = useRef(0);
  const pointsRef = useRef(0);
  const livesRef = useRef(3);
  const torchExpiresAtRef = useRef(0);
  const doorOpenRef = useRef(false);
  const lasersActiveRef = useRef(laserItemsRef.current.length > 0);
  const switchActivatedRef = useRef(false);
  const portalLockedRef = useRef(false);
  const activeBombRef = useRef(null);
  const hasGunRef = useRef(false);
  const gunEffectRef = useRef(null);
  const shieldHealthRef = useRef(0);
  const lastShieldHitRef = useRef(-Infinity);
  const shieldFlashUntilRef = useRef(0);
  const pickaxeHealthRef = useRef(0);
  const lastLockedSoundRef = useRef(0);
  const gameStatusRef = useRef('playing');
  const [position, setPosition] = useState(playerRef.current);
  const [currentMap, setCurrentMap] = useState(initialMap);
  const [levelIndex, setLevelIndex] = useState(0);
  const [keyCount, setKeyCount] = useState(0);
  const [points, setPoints] = useState(0);
  const [lives, setLives] = useState(3);
  const [torchRemaining, setTorchRemaining] = useState(0);
  const [doorOpen, setDoorOpen] = useState(false);
  const [lasersActive, setLasersActive] = useState(laserItemsRef.current.length > 0);
  const [bombCountdown, setBombCountdown] = useState(0);
  const [activeBombId, setActiveBombId] = useState(null);
  const [hasGun, setHasGun] = useState(false);
  const [shieldHealth, setShieldHealth] = useState(0);
  const [pickaxeHealth, setPickaxeHealth] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing');

  useEffect(() => {
    Object.keys(textureSources).forEach((tile) => {
      const image = new Image();
      image.src = textureSources[tile];
      texturesRef.current[tile] = image;
    });
    [
      ['key', keyImage],
      ['coin', coinImage],
      ['heart', extraLifeImage],
      ['shield', shieldImage],
      ['pickaxe', pickaxeImage],
      ['torch', torchImage],
      ['switch', switchImage],
      ['portal', portalImage],
      ['bomb', bombImage],
      ['cannon', cannonImage],
      ['cannonEmitter', cannonTwoImage],
      ['cannonball', cannonballImage],
      ['gun', gunImage],
      ['zombie', zombieImage],
    ].forEach(([name, source]) => {
      const image = new Image();
      image.src = source;
      spriteTexturesRef.current[name] = image;
    });
    const openDoorTexture = new Image();
    openDoorTexture.src = openDoor;
    texturesRef.current.openDoor = openDoorTexture;
  }, []);

  useEffect(() => {
    const down = (event) => {
      if (event.key === 'Tab' && event.shiftKey) {
        event.preventDefault();
        if (!event.repeat && !levelSkipHeldRef.current) levelSkipRequestedRef.current = true;
        levelSkipHeldRef.current = true;
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        if (!event.repeat) fireRequestedRef.current = true;
        return;
      }
      const key = event.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
        event.preventDefault();
        keysRef.current.add(key);
      }
    };
    const up = (event) => {
      if (event.key === 'Tab') levelSkipHeldRef.current = false;
      keysRef.current.delete(event.key.toLowerCase());
    };
    const blur = () => {
      keysRef.current.clear();
      levelSkipHeldRef.current = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (navigator.userAgent.includes('jsdom')) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    context.imageSmoothingEnabled = false;
    let frame;
    let lastTime = performance.now();
    let hudTimer = 0;

    const addPoints = (amount) => {
      pointsRef.current += amount;
      setPoints(pointsRef.current);
    };

    const resetZombie = (zombie) => {
      zombie.x = zombie.initialX;
      zombie.y = zombie.initialY;
      zombie.fromX = zombie.initialX;
      zombie.fromY = zombie.initialY;
      zombie.targetX = zombie.initialX;
      zombie.targetY = zombie.initialY;
      zombie.moveStartedAt = 0;
      zombie.moveEndsAt = 0;
    };

    const shieldAbsorbsHit = (time) => {
      if (time - lastShieldHitRef.current < SHIELD_HIT_COOLDOWN_MS) return true;
      if (shieldHealthRef.current <= 0) return false;
      lastShieldHitRef.current = time;
      shieldHealthRef.current = Math.max(0, shieldHealthRef.current - 0.2);
      shieldFlashUntilRef.current = time + 180;
      setShieldHealth(shieldHealthRef.current);
      playSound(shieldUse);
      return true;
    };

    const loseLife = (map) => {
      livesRef.current = Math.max(0, livesRef.current - 1);
      setLives(livesRef.current);
      keysRef.current.clear();
      playSound(gubbeDie);
      if (livesRef.current === 0) {
        gameStatusRef.current = 'gameover';
        setGameStatus('gameover');
        return false;
      }
      const restart = findStart(map);
      playerRef.current = restart;
      setPosition({ ...restart });
      return true;
    };

    const finishGame = (awardPoints = true) => {
      if (gameStatusRef.current !== 'playing') return;
      if (awardPoints) addPoints(10);
      gameStatusRef.current = 'complete';
      keysRef.current.clear();
      setGameStatus('complete');
      playSound(endMusic);
    };

    const resetGame = () => {
      const firstMap = levels[0].blocks;
      const firstPlayer = findStart(firstMap);
      const firstLasers = findTiles(firstMap, 15);
      levelIndexRef.current = 0;
      mapRef.current = firstMap;
      playerRef.current = firstPlayer;
      keyItemsRef.current = findTiles(firstMap, 2);
      coinItemsRef.current = findTiles(firstMap, 11);
      heartItemsRef.current = findTiles(firstMap, 12);
      shieldItemsRef.current = findTiles(firstMap, 13);
      pickaxeItemsRef.current = findTiles(firstMap, 19);
      torchItemsRef.current = findTiles(firstMap, 22);
      doorItemsRef.current = findTiles(firstMap, 3);
      laserItemsRef.current = firstLasers;
      switchItemsRef.current = findTiles(firstMap, 16);
      portalItemsRef.current = findTiles(firstMap, 8);
      bombItemsRef.current = findTiles(firstMap, 17);
      gunItemsRef.current = findTiles(firstMap, 24);
      cannonItemsRef.current = findTiles(firstMap, 14);
      cannonEmitterItemsRef.current = findTiles(firstMap, 18);
      cannonballsRef.current = createCannonballs(firstMap);
      zombieItemsRef.current = createZombies(firstMap);
      nextCannonStepRef.current = 0;
      nextZombieStepRef.current = 0;
      collectedKeysRef.current = new Set();
      collectedCoinsRef.current = new Set();
      collectedHeartsRef.current = new Set();
      collectedShieldsRef.current = new Set();
      collectedPickaxesRef.current = new Set();
      collectedTorchesRef.current = new Set();
      collectedGunsRef.current = new Set();
      keyCountRef.current = 0;
      pointsRef.current = 0;
      livesRef.current = 3;
      torchExpiresAtRef.current = 0;
      doorOpenRef.current = false;
      lasersActiveRef.current = firstLasers.length > 0;
      switchActivatedRef.current = false;
      portalLockedRef.current = false;
      activeBombRef.current = null;
      hasGunRef.current = false;
      gunEffectRef.current = null;
      shieldHealthRef.current = 0;
      pickaxeHealthRef.current = 0;
      lastShieldHitRef.current = -Infinity;
      shieldFlashUntilRef.current = 0;
      levelSkipRequestedRef.current = false;
      levelSkipHeldRef.current = false;
      fireRequestedRef.current = false;
      lastLockedSoundRef.current = 0;
      gameStatusRef.current = 'playing';
      endMusic.pause();
      endMusic.currentTime = 0;
      setLevelIndex(0);
      setCurrentMap(firstMap);
      setPosition({ ...firstPlayer });
      setKeyCount(0);
      setPoints(0);
      setLives(3);
      setTorchRemaining(0);
      setDoorOpen(false);
      setLasersActive(firstLasers.length > 0);
      setBombCountdown(0);
      setActiveBombId(null);
      setHasGun(false);
      setShieldHealth(0);
      setPickaxeHealth(0);
      setGameStatus('playing');
      playSound(newGame);
    };

    const advanceLevel = (awardCompletionPoints = false) => {
      const nextLevel = levelIndexRef.current + 1;
      if (nextLevel >= levels.length) return false;
      const nextMap = levels[nextLevel].blocks;
      const nextPlayer = findStart(nextMap);
      const nextLasers = findTiles(nextMap, 15);
      levelIndexRef.current = nextLevel;
      mapRef.current = nextMap;
      playerRef.current = nextPlayer;
      keyItemsRef.current = findTiles(nextMap, 2);
      coinItemsRef.current = findTiles(nextMap, 11);
      heartItemsRef.current = findTiles(nextMap, 12);
      shieldItemsRef.current = findTiles(nextMap, 13);
      pickaxeItemsRef.current = findTiles(nextMap, 19);
      torchItemsRef.current = findTiles(nextMap, 22);
      doorItemsRef.current = findTiles(nextMap, 3);
      laserItemsRef.current = nextLasers;
      switchItemsRef.current = findTiles(nextMap, 16);
      portalItemsRef.current = findTiles(nextMap, 8);
      bombItemsRef.current = findTiles(nextMap, 17);
      gunItemsRef.current = findTiles(nextMap, 24);
      cannonItemsRef.current = findTiles(nextMap, 14);
      cannonEmitterItemsRef.current = findTiles(nextMap, 18);
      cannonballsRef.current = createCannonballs(nextMap);
      zombieItemsRef.current = createZombies(nextMap);
      nextCannonStepRef.current = 0;
      nextZombieStepRef.current = 0;
      collectedKeysRef.current = new Set();
      collectedCoinsRef.current = new Set();
      collectedHeartsRef.current = new Set();
      collectedShieldsRef.current = new Set();
      collectedPickaxesRef.current = new Set();
      collectedTorchesRef.current = new Set();
      collectedGunsRef.current = new Set();
      keyCountRef.current = 0;
      torchExpiresAtRef.current = 0;
      doorOpenRef.current = false;
      lasersActiveRef.current = nextLasers.length > 0;
      switchActivatedRef.current = false;
      portalLockedRef.current = false;
      activeBombRef.current = null;
      hasGunRef.current = false;
      gunEffectRef.current = null;
      shieldHealthRef.current = 0;
      pickaxeHealthRef.current = 0;
      lastShieldHitRef.current = -Infinity;
      keysRef.current.clear();
      setLevelIndex(nextLevel);
      setCurrentMap(nextMap);
      setPosition({ ...nextPlayer });
      setKeyCount(0);
      setTorchRemaining(0);
      setDoorOpen(false);
      setLasersActive(nextLasers.length > 0);
      setBombCountdown(0);
      setActiveBombId(null);
      setHasGun(false);
      setShieldHealth(0);
      setPickaxeHealth(0);
      if (awardCompletionPoints) addPoints(10);
      playSound(newGame);
      return true;
    };

    const render = (time) => {
      const bounds = canvas.getBoundingClientRect();
      const displayWidth = Math.max(320, Math.floor(bounds.width / 2));
      const displayHeight = Math.max(180, Math.floor(bounds.height / 2));
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        context.imageSmoothingEnabled = false;
      }

      if (restartRequestedRef.current) {
        restartRequestedRef.current = false;
        resetGame();
        lastTime = time;
      }
      if (gameStatusRef.current !== 'playing') {
        keysRef.current.clear();
        lastTime = time;
        frame = requestAnimationFrame(render);
        return;
      }

      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      if (levelSkipRequestedRef.current) {
        levelSkipRequestedRef.current = false;
        if (advanceLevel()) {
          frame = requestAnimationFrame(render);
          return;
        } else if (levelIndexRef.current === levels.length - 1) {
          finishGame(false);
          frame = requestAnimationFrame(render);
          return;
        }
      }
      const player = playerRef.current;
      const map = mapRef.current;
      const keys = keysRef.current;
      const torchActive = torchExpiresAtRef.current > time;
      const torchFlicker = torchActive
        ? 0.84 + Math.sin(time * 0.021) * 0.1 + Math.sin(time * 0.067) * 0.06
        : 0;
      const viewDistance = torchActive
        ? BASE_VIEW_DISTANCE + (TORCH_VIEW_DISTANCE - BASE_VIEW_DISTANCE) * torchFlicker
        : BASE_VIEW_DISTANCE;
      const turn = (keys.has('arrowleft') || keys.has('a') ? -1 : 0) +
        (keys.has('arrowright') || keys.has('d') ? 1 : 0);
      const move = (keys.has('arrowup') || keys.has('w') ? 1 : 0) +
        (keys.has('arrowdown') || keys.has('s') ? -1 : 0);
      player.angle += turn * TURN_SPEED * delta;

      if (move !== 0) {
        const nextX = player.x + Math.cos(player.angle) * move * MOVE_SPEED * delta;
        const nextY = player.y + Math.sin(player.angle) * move * MOVE_SPEED * delta;
        const xClear = canStand(map, nextX, player.y, doorOpenRef.current);
        const yClear = canStand(map, player.x, nextY, doorOpenRef.current);
        if (xClear) player.x = nextX;
        if (yClear) player.y = nextY;

        const leadingX = nextX + Math.cos(player.angle) * PLAYER_RADIUS * move;
        const leadingY = nextY + Math.sin(player.angle) * PLAYER_RADIUS * move;
        const leadingTile = tileAt(map, leadingX, leadingY);
        if (!doorOpenRef.current && keyCountRef.current === 0 && (!xClear || !yClear)) {
          if (leadingTile === 3 && time - lastLockedSoundRef.current > 800) {
            lastLockedSoundRef.current = time;
            playSoundAt(noKey, leadingX, leadingY, player);
          }
        }
        if (leadingTile === 26 && pickaxeHealthRef.current > 0 && (!xClear || !yClear)) {
          const sandX = Math.floor(leadingX);
          const sandY = Math.floor(leadingY);
          const nextMap = map.map((row, y) => row.map((tile, x) => (
            x === sandX && y === sandY ? 0 : tile
          )));
          pickaxeHealthRef.current = Math.max(0, pickaxeHealthRef.current - 0.25);
          mapRef.current = nextMap;
          setCurrentMap(nextMap);
          setPickaxeHealth(pickaxeHealthRef.current);
          playSoundAt(explosion, sandX + 0.5, sandY + 0.5, player);
        }
        if (leadingTile === 17 && !activeBombRef.current) {
          const bombX = Math.floor(leadingX);
          const bombY = Math.floor(leadingY);
          activeBombRef.current = {
            id: `${bombX}-${bombY}`,
            x: bombX,
            y: bombY,
            detonateAt: time + BOMB_COUNTDOWN_MS,
          };
          setActiveBombId(`${bombX}-${bombY}`);
          setBombCountdown(BOMB_COUNTDOWN_MS / 1000);
          playSoundAt(bombSound, bombX + 0.5, bombY + 0.5, player);
        }
      }

      if (activeBombRef.current && time >= activeBombRef.current.detonateAt) {
        const bomb = activeBombRef.current;
        const nextMap = map.map((row, y) => row.map((tile, x) => (
          Math.abs(x - bomb.x) < 2 && Math.abs(y - bomb.y) < 2 ? 0 : tile
        )));
        const nextLasers = findTiles(nextMap, 15);
        mapRef.current = nextMap;
        keyItemsRef.current = findTiles(nextMap, 2);
        coinItemsRef.current = findTiles(nextMap, 11);
        heartItemsRef.current = findTiles(nextMap, 12);
        shieldItemsRef.current = findTiles(nextMap, 13);
        pickaxeItemsRef.current = findTiles(nextMap, 19);
        torchItemsRef.current = findTiles(nextMap, 22);
        doorItemsRef.current = findTiles(nextMap, 3);
        laserItemsRef.current = nextLasers;
        switchItemsRef.current = findTiles(nextMap, 16);
        portalItemsRef.current = findTiles(nextMap, 8);
        bombItemsRef.current = findTiles(nextMap, 17);
        gunItemsRef.current = findTiles(nextMap, 24);
        cannonItemsRef.current = findTiles(nextMap, 14);
        cannonEmitterItemsRef.current = findTiles(nextMap, 18);
        cannonballsRef.current = createCannonballs(nextMap);
        zombieItemsRef.current = createZombies(nextMap);
        nextCannonStepRef.current = 0;
        nextZombieStepRef.current = 0;
        lasersActiveRef.current = lasersActiveRef.current && nextLasers.length > 0;
        activeBombRef.current = null;
        setCurrentMap(nextMap);
        setLasersActive(lasersActiveRef.current);
        setBombCountdown(0);
        setActiveBombId(null);
        playSoundAt(explosion, bomb.x + 0.5, bomb.y + 0.5, player);
        frame = requestAnimationFrame(render);
        return;
      }

      cannonballsRef.current.forEach((cannonball) => {
        if (!cannonball.moving) return;
        const duration = cannonball.moveEndsAt - cannonball.moveStartedAt;
        const progress = duration > 0
          ? Math.min(1, Math.max(0, (time - cannonball.moveStartedAt) / duration))
          : 1;
        const easedProgress = progress * progress * (3 - 2 * progress);
        cannonball.x = cannonball.fromX +
          (cannonball.targetX - cannonball.fromX) * easedProgress;
        cannonball.y = cannonball.fromY +
          (cannonball.targetY - cannonball.fromY) * easedProgress;
      });

      if (cannonballsRef.current.length > 0 && time >= nextCannonStepRef.current) {
        let nearestFiringCannon = Infinity;
        cannonballsRef.current.forEach((cannonball) => {
          if (!cannonball.moving) {
            cannonball.x = cannonball.originX;
            cannonball.y = cannonball.originY;
            cannonball.fromX = cannonball.originX;
            cannonball.fromY = cannonball.originY;
            cannonball.targetX = cannonball.originX;
            cannonball.targetY = cannonball.originY + 1;
            cannonball.moveStartedAt = time;
            cannonball.moveEndsAt = time + CANNON_MOVE_MS;
            cannonball.impacting = tileAt(
              map,
              cannonball.targetX,
              cannonball.targetY
            ) !== 0;
            cannonball.moving = true;
            nearestFiringCannon = Math.min(
              nearestFiringCannon,
              Math.hypot(cannonball.originX - player.x, cannonball.originY - player.y)
            );
          } else if (!cannonball.impacting) {
            cannonball.x = cannonball.targetX;
            cannonball.y = cannonball.targetY;
            cannonball.fromX = cannonball.targetX;
            cannonball.fromY = cannonball.targetY;
            cannonball.targetY += 1;
            cannonball.moveStartedAt = time;
            cannonball.moveEndsAt = time + CANNON_MOVE_MS;
            cannonball.impacting = tileAt(
              map,
              cannonball.targetX,
              cannonball.targetY
            ) !== 0;
          } else {
            cannonball.x = cannonball.targetX;
            cannonball.y = cannonball.targetY;
            cannonball.impacting = false;
            cannonball.moving = false;
          }
        });
        nextCannonStepRef.current = time + CANNON_STEP_MS;
        if (nearestFiringCannon < Infinity) {
          const proximity = Math.max(0, 1 - nearestFiringCannon / SOUND_FALLOFF_DISTANCE);
          playSound(cannonSound, proximity * proximity);
        }
      }

      zombieItemsRef.current.forEach((zombie) => {
        const duration = zombie.moveEndsAt - zombie.moveStartedAt;
        const progress = duration > 0
          ? Math.min(1, Math.max(0, (time - zombie.moveStartedAt) / duration))
          : 1;
        const easedProgress = progress * progress * (3 - 2 * progress);
        zombie.x = zombie.fromX + (zombie.targetX - zombie.fromX) * easedProgress;
        zombie.y = zombie.fromY + (zombie.targetY - zombie.fromY) * easedProgress;
      });

      if (zombieItemsRef.current.length > 0 && time >= nextZombieStepRef.current) {
        const isCollectedFloor = (x, y, tile) => {
          const id = `${x}-${y}`;
          return (tile === 2 && collectedKeysRef.current.has(id)) ||
            (tile === 11 && collectedCoinsRef.current.has(id)) ||
            (tile === 12 && collectedHeartsRef.current.has(id)) ||
            (tile === 13 && collectedShieldsRef.current.has(id)) ||
            (tile === 19 && collectedPickaxesRef.current.has(id)) ||
            (tile === 22 && collectedTorchesRef.current.has(id)) ||
            (tile === 24 && collectedGunsRef.current.has(id));
        };
        const isZombieWalkable = (x, y) => {
          const tile = map[y] && map[y][x];
          return tile === 0 || tile === 15 || isCollectedFloor(x, y, tile);
        };
        const goal = { x: Math.floor(player.x), y: Math.floor(player.y) };
        zombieItemsRef.current.forEach((zombie) => {
          const start = { x: Math.floor(zombie.targetX), y: Math.floor(zombie.targetY) };
          const path = findGridPath(map, start, goal, isZombieWalkable);
          if (path.length > 1) {
            zombie.fromX = zombie.targetX;
            zombie.fromY = zombie.targetY;
            zombie.targetX = path[1].x + 0.5;
            zombie.targetY = path[1].y + 0.5;
            zombie.moveStartedAt = time;
            zombie.moveEndsAt = time + ZOMBIE_MOVE_MS;
            if (tileAt(map, zombie.targetX, zombie.targetY) === 15) resetZombie(zombie);
          }
        });
        nextZombieStepRef.current = time + ZOMBIE_STEP_MS;
      }

      cannonballsRef.current.forEach((cannonball) => {
        if (!cannonball.moving) return;
        const hitZombie = zombieItemsRef.current.find((zombie) =>
          Math.hypot(cannonball.x - zombie.x, cannonball.y - zombie.y) < 0.48
        );
        if (hitZombie) resetZombie(hitZombie);
      });

      const hitCannonball = cannonballsRef.current.some((cannonball) =>
        cannonball.moving && Math.hypot(cannonball.x - player.x, cannonball.y - player.y) < 0.48
      );
      if (hitCannonball) {
        if (shieldAbsorbsHit(time)) {
          cannonballsRef.current.forEach((cannonball) => {
            if (Math.hypot(cannonball.x - player.x, cannonball.y - player.y) < 0.48) {
              cannonball.moving = false;
            }
          });
        } else {
        loseLife(map);
        frame = requestAnimationFrame(render);
        return;
        }
      }

      const collidingZombie = zombieItemsRef.current.find((zombie) =>
        Math.hypot(zombie.x - player.x, zombie.y - player.y) < 0.46
      );
      if (collidingZombie) {
        if (shieldAbsorbsHit(time)) {
          resetZombie(collidingZombie);
        } else {
        resetZombie(collidingZombie);
        loseLife(map);
        frame = requestAnimationFrame(render);
        return;
        }
      }

      const activePortal = portalItemsRef.current.find((item) =>
        Math.hypot(item.x - player.x, item.y - player.y) < 0.48
      );
      if (activePortal && !portalLockedRef.current) {
        const destination = portalItemsRef.current.find((item) => item.id !== activePortal.id);
        if (destination) {
          player.x = destination.x;
          player.y = destination.y;
          portalLockedRef.current = true;
          setPosition({ ...player });
          playSoundAt(portalSound, destination.x, destination.y, player);
        }
      } else if (!activePortal) {
        portalLockedRef.current = false;
      }

      keyItemsRef.current.forEach((item) => {
        if (!collectedKeysRef.current.has(item.id) && Math.hypot(item.x - player.x, item.y - player.y) < 0.55) {
          collectedKeysRef.current.add(item.id);
          keyCountRef.current += 1;
          setKeyCount(keyCountRef.current);
          addPoints(5);
          playSoundAt(keySound, item.x, item.y, player);
        }
      });

      coinItemsRef.current.forEach((item) => {
        if (!collectedCoinsRef.current.has(item.id) && Math.hypot(item.x - player.x, item.y - player.y) < 0.55) {
          collectedCoinsRef.current.add(item.id);
          addPoints(3);
          playSoundAt(peng, item.x, item.y, player);
        }
      });

      heartItemsRef.current.forEach((item) => {
        if (!collectedHeartsRef.current.has(item.id) && Math.hypot(item.x - player.x, item.y - player.y) < 0.55) {
          collectedHeartsRef.current.add(item.id);
          livesRef.current += 1;
          setLives(livesRef.current);
          playSoundAt(powerupSound, item.x, item.y, player);
        }
      });

      shieldItemsRef.current.forEach((item) => {
        if (!collectedShieldsRef.current.has(item.id) &&
          Math.hypot(item.x - player.x, item.y - player.y) < 0.55) {
          collectedShieldsRef.current.add(item.id);
          shieldHealthRef.current = 1;
          lastShieldHitRef.current = -Infinity;
          setShieldHealth(1);
          addPoints(10);
          playSoundAt(shieldSound, item.x, item.y, player);
        }
      });

      pickaxeItemsRef.current.forEach((item) => {
        if (!collectedPickaxesRef.current.has(item.id) &&
          Math.hypot(item.x - player.x, item.y - player.y) < 0.55) {
          collectedPickaxesRef.current.add(item.id);
          pickaxeHealthRef.current = 1;
          setPickaxeHealth(1);
          addPoints(5);
          playSoundAt(keySound, item.x, item.y, player);
        }
      });

      torchItemsRef.current.forEach((item) => {
        if (!collectedTorchesRef.current.has(item.id) && Math.hypot(item.x - player.x, item.y - player.y) < 0.55) {
          collectedTorchesRef.current.add(item.id);
          torchExpiresAtRef.current = time + TORCH_DURATION_MS;
          setTorchRemaining(TORCH_DURATION_MS / 1000);
          addPoints(5);
          playSoundAt(fire, item.x, item.y, player);
        }
      });

      gunItemsRef.current.forEach((item) => {
        if (!collectedGunsRef.current.has(item.id) &&
          Math.hypot(item.x - player.x, item.y - player.y) < 0.55) {
          collectedGunsRef.current.add(item.id);
          hasGunRef.current = true;
          setHasGun(true);
          addPoints(5);
          playSoundAt(getGunSound, item.x, item.y, player);
        }
      });

      if (fireRequestedRef.current) {
        fireRequestedRef.current = false;
        if (hasGunRef.current) {
          const isGunPassable = (x, y) => {
            const tile = map[y] && map[y][x];
            const id = `${x}-${y}`;
            return tile === 0 || tile === 20 || tile === 21 ||
              (tile === 2 && collectedKeysRef.current.has(id)) ||
              (tile === 11 && collectedCoinsRef.current.has(id)) ||
              (tile === 12 && collectedHeartsRef.current.has(id)) ||
              (tile === 13 && collectedShieldsRef.current.has(id)) ||
              (tile === 19 && collectedPickaxesRef.current.has(id)) ||
              (tile === 22 && collectedTorchesRef.current.has(id)) ||
              (tile === 24 && collectedGunsRef.current.has(id));
          };
          const shot = traceGunShot(map, player, zombieItemsRef.current, isGunPassable);
          if (shot.hitTarget) resetZombie(shot.hitTarget);
          gunEffectRef.current = { ...shot, firedAt: time, expiresAt: time + GUN_EFFECT_MS };
          playSound(cannonSound);
        }
      }

      if (lasersActiveRef.current && !switchActivatedRef.current) {
        const switchWasPressed = switchItemsRef.current.some((item) =>
          Math.hypot(item.x - player.x, item.y - player.y) < 0.55
        );
        if (switchWasPressed) {
          switchActivatedRef.current = true;
          lasersActiveRef.current = false;
          setLasersActive(false);
          const pressedSwitch = switchItemsRef.current.find((item) =>
            Math.hypot(item.x - player.x, item.y - player.y) < 0.55
          );
          if (pressedSwitch) playSoundAt(laserSound, pressedSwitch.x, pressedSwitch.y, player);
        }
      }

      if (lasersActiveRef.current) {
        const hitLaser = laserItemsRef.current.some((item) =>
          Math.hypot(item.x - player.x, item.y - player.y) < 0.48
        );
        if (hitLaser) {
          if (shieldAbsorbsHit(time)) {
            // The shield allows a short window to cross the active beam.
          } else {
          loseLife(map);
          frame = requestAnimationFrame(render);
          return;
          }
        }
      }

      if (!doorOpenRef.current && keyCountRef.current > 0) {
        const doorIsNear = doorItemsRef.current.some((item) =>
          Math.hypot(item.x - player.x, item.y - player.y) <= 1.5
        );
        if (doorIsNear) {
          doorOpenRef.current = true;
          setDoorOpen(true);
          const nearestDoor = doorItemsRef.current.reduce((nearest, item) => (
            !nearest || Math.hypot(item.x - player.x, item.y - player.y) <
              Math.hypot(nearest.x - player.x, nearest.y - player.y) ? item : nearest
          ), null);
          if (nearestDoor) playSoundAt(win, nearestDoor.x, nearestDoor.y, player);
        }
      }

      if (doorOpenRef.current && tileAt(map, player.x, player.y) === 3) {
        if (advanceLevel(true)) {
          frame = requestAnimationFrame(render);
          return;
        } else if (levelIndexRef.current === levels.length - 1) {
          finishGame(true);
          frame = requestAnimationFrame(render);
          return;
        }
      }

      context.fillStyle = '#000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const zBuffer = new Array(canvas.width);
      const drawLaserColumn = (screenX, laserRayDistance, rayAngle) => {
        if (!lasersActiveRef.current || laserRayDistance === null) return;
        const laserDistance = laserRayDistance * Math.cos(rayAngle - player.angle);
        if (laserDistance > viewDistance) return;
        const laserHeight = Math.min(
          canvas.height * 2,
          canvas.height / Math.max(laserDistance, 0.01)
        );
        const laserTop = Math.floor((canvas.height - laserHeight) / 2);
        const pulse = 0.82 + Math.sin(time * 0.014) * 0.18;
        const coreHeight = Math.max(2, Math.floor(laserHeight * 0.045));
        context.fillStyle = `rgba(255, 59, 48, ${0.13 * pulse})`;
        context.fillRect(screenX, laserTop, 1, laserHeight);
        context.fillStyle = `rgba(255, 59, 48, ${0.72 * pulse})`;
        context.fillRect(screenX, Math.floor(canvas.height / 2 - coreHeight / 2), 1, coreHeight);
      };
      for (let x = 0; x < canvas.width; x += 1) {
        const rayAngle = player.angle - FIELD_OF_VIEW / 2 + (x / canvas.width) * FIELD_OF_VIEW;
        const hit = castRay(map, player.x, player.y, rayAngle);
        const correctedDistance = hit.distance * Math.cos(rayAngle - player.angle);
        zBuffer[x] = correctedDistance;
        if (hit.distance > viewDistance) {
          drawLaserColumn(x, hit.laserDistance, rayAngle);
          continue;
        }
        const wallHeight = Math.min(canvas.height * 2, canvas.height / Math.max(correctedDistance, 0.01));
        const top = Math.floor((canvas.height - wallHeight) / 2);
        const texture = hit.tile === 3 && doorOpenRef.current
          ? texturesRef.current.openDoor
          : texturesRef.current[hit.tile] || texturesRef.current[1];
        const textureColumn = texture && texture.complete
          ? Math.min(texture.width - 1, Math.floor(hit.textureX * texture.width)) : 0;

        if (texture && texture.complete && texture.naturalWidth) {
          context.drawImage(texture, textureColumn, 0, 1, texture.height, x, top, 1, wallHeight);
        } else {
          context.fillStyle = '#89966c';
          context.fillRect(x, top, 1, wallHeight);
        }
        const shade = Math.min(0.96, hit.distance / viewDistance + (hit.side === 1 ? 0.12 : 0));
        context.fillStyle = `rgba(0, 0, 0, ${shade})`;
        context.fillRect(x, top, 1, wallHeight);
        if (torchActive) {
          const warmth = Math.max(0, 1 - hit.distance / viewDistance) * (0.05 + torchFlicker * 0.09);
          context.fillStyle = `rgba(255, 184, 0, ${warmth})`;
          context.fillRect(x, top, 1, wallHeight);
        }
        drawLaserColumn(x, hit.laserDistance, rayAngle);
      }


      const spriteTextures = spriteTexturesRef.current;
      if (spriteTextures.key && spriteTextures.key.complete && spriteTextures.key.naturalWidth) {
        if (spriteTextures.portal && spriteTextures.portal.complete && spriteTextures.portal.naturalWidth) {
          if (!portalFrameRef.current) portalFrameRef.current = document.createElement('canvas');
          const portalFrame = portalFrameRef.current;
          if (portalFrame.width !== spriteTextures.portal.width ||
            portalFrame.height !== spriteTextures.portal.height) {
            portalFrame.width = spriteTextures.portal.width;
            portalFrame.height = spriteTextures.portal.height;
          }
          const portalContext = portalFrame.getContext('2d');
          portalContext.clearRect(0, 0, portalFrame.width, portalFrame.height);
          portalContext.imageSmoothingEnabled = false;
          portalContext.save();
          portalContext.translate(portalFrame.width / 2, portalFrame.height / 2);
          portalContext.rotate((time / 5000) * Math.PI * 2);
          portalContext.drawImage(
            spriteTextures.portal,
            -portalFrame.width / 2,
            -portalFrame.height / 2
          );
          portalContext.restore();
        }
        const directionX = Math.cos(player.angle);
        const directionY = Math.sin(player.angle);
        const planeScale = Math.tan(FIELD_OF_VIEW / 2);
        const planeX = -directionY * planeScale;
        const planeY = directionX * planeScale;
        const inverseDeterminant = 1 / (planeX * directionY - directionX * planeY);
        const bombRemaining = activeBombRef.current
          ? Math.max(0, activeBombRef.current.detonateAt - time)
          : 0;
        const bombFlashInterval = bombRemaining < 1000 ? 80 : bombRemaining < 2000 ? 140 : 260;
        const worldSprites = keyItemsRef.current
          .filter((item) => !collectedKeysRef.current.has(item.id))
          .map((item) => ({ ...item, texture: spriteTextures.key }))
          .concat(coinItemsRef.current
            .filter((item) => !collectedCoinsRef.current.has(item.id))
            .map((item) => ({ ...item, texture: spriteTextures.coin })))
          .concat(heartItemsRef.current
            .filter((item) => !collectedHeartsRef.current.has(item.id))
            .map((item) => ({ ...item, texture: spriteTextures.heart })))
          .concat(shieldItemsRef.current
            .filter((item) => !collectedShieldsRef.current.has(item.id))
            .map((item) => ({ ...item, texture: spriteTextures.shield })))
          .concat(pickaxeItemsRef.current
            .filter((item) => !collectedPickaxesRef.current.has(item.id))
            .map((item) => ({ ...item, texture: spriteTextures.pickaxe })))
          .concat(torchItemsRef.current
            .filter((item) => !collectedTorchesRef.current.has(item.id))
            .map((item) => ({ ...item, texture: spriteTextures.torch })))
          .concat(gunItemsRef.current
            .filter((item) => !collectedGunsRef.current.has(item.id))
            .map((item) => ({ ...item, texture: spriteTextures.gun })))
          .concat(zombieItemsRef.current.map((item) => ({
            ...item,
            texture: spriteTextures.zombie,
            scale: 0.62,
          })))
          .concat(portalItemsRef.current.map((item) => ({
            ...item,
            texture: portalFrameRef.current || spriteTextures.portal,
          })))
          .concat(bombItemsRef.current.map((item) => ({
            ...item,
            texture: spriteTextures.bomb,
            inverted: activeBombRef.current && activeBombRef.current.id === item.id &&
              Math.floor(time / bombFlashInterval) % 2 === 0,
          })))
          .concat(cannonItemsRef.current.map((item) => ({
            ...item,
            texture: spriteTextures.cannon,
          })))
          .concat(cannonEmitterItemsRef.current.map((item) => ({
            ...item,
            texture: spriteTextures.cannonEmitter,
          })))
          .concat(cannonballsRef.current
            .filter((item) => item.moving)
            .map((item) => ({ ...item, texture: spriteTextures.cannonball, scale: 0.24 })))
          .concat(switchItemsRef.current.map((item) => ({ ...item, texture: spriteTextures.switch })))
          .map((item) => ({ ...item, distance: Math.hypot(item.x - player.x, item.y - player.y) }))
          .filter((item) => item.distance <= viewDistance)
          .sort((a, b) => b.distance - a.distance);

        worldSprites.forEach((item) => {
          const texture = item.texture;
          const textureWidth = texture && (texture.naturalWidth || texture.width);
          const textureHeight = texture && (texture.naturalHeight || texture.height);
          if (!texture || !textureWidth || !textureHeight || texture.complete === false) return;
          const relativeX = item.x - player.x;
          const relativeY = item.y - player.y;
          const transformX = inverseDeterminant * (directionY * relativeX - directionX * relativeY);
          const transformY = inverseDeterminant * (-planeY * relativeX + planeX * relativeY);
          if (transformY <= 0.05) return;

          const screenX = Math.floor((canvas.width / 2) * (1 + transformX / transformY));
          const spriteSize = Math.max(
            1,
            Math.abs(Math.floor((canvas.height / transformY) * (item.scale || WORLD_SPRITE_SCALE)))
          );
          const startX = Math.floor(screenX - spriteSize / 2);
          const endX = Math.floor(screenX + spriteSize / 2);
          const imageHeight = spriteSize * (textureHeight / textureWidth);
          const imageTop = (canvas.height - imageHeight) / 2;
          context.globalAlpha = Math.max(0.12, 1 - item.distance / viewDistance);
          context.filter = item.inverted ? 'invert(1)' : 'none';

          for (let stripe = Math.max(0, startX); stripe < Math.min(canvas.width, endX); stripe += 1) {
            if (transformY >= zBuffer[stripe]) continue;
            const textureX = Math.floor(((stripe - startX) / spriteSize) * textureWidth);
            context.drawImage(texture, textureX, 0, 1, textureHeight, stripe, imageTop, 1, imageHeight);
          }
          context.filter = 'none';
          context.globalAlpha = 1;
        });
      }

      context.fillStyle = 'rgba(198, 255, 74, 0.75)';
      context.fillRect(canvas.width / 2 - 1, canvas.height / 2 - 5, 2, 10);
      context.fillRect(canvas.width / 2 - 5, canvas.height / 2 - 1, 10, 2);
      if (hasGunRef.current && spriteTextures.gun && spriteTextures.gun.complete) {
        const firing = gunEffectRef.current && gunEffectRef.current.expiresAt > time;
        const weaponSize = Math.max(48, Math.floor(canvas.height * 0.22));
        const recoil = firing ? Math.floor(weaponSize * 0.08) : 0;
        context.globalAlpha = 0.92;
        context.drawImage(
          spriteTextures.gun,
          canvas.width / 2 - weaponSize / 2,
          canvas.height - weaponSize + recoil,
          weaponSize,
          weaponSize
        );
        context.globalAlpha = 1;
      }
      if (gunEffectRef.current && gunEffectRef.current.expiresAt > time) {
        const progress = (time - gunEffectRef.current.firedAt) / GUN_EFFECT_MS;
        context.strokeStyle = `rgba(255, 184, 0, ${1 - progress})`;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(canvas.width / 2, canvas.height * 0.79);
        context.lineTo(canvas.width / 2, canvas.height / 2);
        context.stroke();
        context.fillStyle = `rgba(255, 255, 255, ${1 - progress})`;
        context.fillRect(canvas.width / 2 - 3, canvas.height / 2 - 3, 6, 6);
      }
      if (shieldFlashUntilRef.current > time) {
        const flashAlpha = ((shieldFlashUntilRef.current - time) / 180) * 0.65;
        context.strokeStyle = `rgba(198, 255, 74, ${flashAlpha})`;
        context.lineWidth = Math.max(3, Math.floor(canvas.height * 0.018));
        context.strokeRect(0, 0, canvas.width, canvas.height);
      }
      hudTimer += delta;
      if (hudTimer > 0.1) {
        hudTimer = 0;
        setPosition({ ...player });
        const remaining = Math.max(0, (torchExpiresAtRef.current - time) / 1000);
        setTorchRemaining(remaining);
        const bombRemaining = activeBombRef.current
          ? Math.max(0, (activeBombRef.current.detonateAt - time) / 1000)
          : 0;
        setBombCountdown(bombRemaining);
      }
      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, []);

  const setControl = (key, active) => {
    if (active) keysRef.current.add(key);
    else keysRef.current.delete(key);
  };

  const hasLaserSystem = currentMap.some((row) => row.includes(15) || row.includes(16));

  return (
    <main className="raycaster-shell">
      <header className="game-header">
        <div><p className="eyebrow">OLLES LABYRINT</p><h1>LEVEL {String(levelIndex + 1).padStart(2, '0')}</h1></div>
        <div className="status-readout">
          {hasLaserSystem && <p className={lasersActive ? 'lasers-active' : 'lasers-off'}>
            LASERS {lasersActive ? 'ACTIVE' : 'OFF'}
          </p>}
          {bombCountdown > 0 && <p className="bomb-countdown">BOMB {bombCountdown.toFixed(1)}s</p>}
          <p className="score">POINTS {points}</p>
          <p className="lives">LIVES {lives}</p>
          <p className="coordinates">X {position.x.toFixed(1)} · Y {position.y.toFixed(1)}</p>
        </div>
      </header>
      <section className="viewport-frame" aria-label="First-person maze view">
        <canvas ref={canvasRef} className="game-canvas" />
        <div className="scanlines" aria-hidden="true" />
        <p className="range">VIEW RANGE {torchRemaining > 0 ? TORCH_VIEW_DISTANCE : BASE_VIEW_DISTANCE} BLOCKS</p>
        <div className="hud-panels">
          <Inventory keyCount={keyCount} torchRemaining={torchRemaining} hasGun={hasGun}
            shieldHealth={shieldHealth} pickaxeHealth={pickaxeHealth} />
          <MiniMap map={currentMap} player={position} doorOpen={doorOpen}
            collectedKeys={collectedKeysRef.current} collectedCoins={collectedCoinsRef.current}
            collectedHearts={collectedHeartsRef.current} collectedTorches={collectedTorchesRef.current}
            collectedGuns={collectedGunsRef.current}
            collectedShields={collectedShieldsRef.current}
            collectedPickaxes={collectedPickaxesRef.current}
            zombies={zombieItemsRef.current}
            lasersActive={lasersActive} activeBombId={activeBombId} />
        </div>
        {gameStatus !== 'playing' && (
          <div className={`game-state-overlay ${gameStatus}`} role="dialog"
            aria-label={gameStatus === 'gameover' ? 'Game over' : 'Game complete'}>
            <img src={gameStatus === 'gameover' ? gameOverImage : successImage}
              alt={gameStatus === 'gameover' ? 'Game over' : 'Game complete'} />
            <p>POINTS {points}</p>
            <button type="button" onClick={() => { restartRequestedRef.current = true; }}>
              PLAY AGAIN
            </button>
          </div>
        )}
      </section>
      <footer className="game-footer">
          <p>W/S OR ↑/↓ MOVE <span>A/D OR ←/→ TURN</span><span>SPACE FIRE</span><span>SHIFT+TAB NEXT LEVEL</span></p>
        <div className="touch-controls" aria-label="Touch controls">
          {[
            ['arrowleft', 'TURN LEFT'], ['arrowup', 'FORWARD'],
            ['arrowdown', 'BACK'], ['arrowright', 'TURN RIGHT'],
          ].map(([key, label]) => (
            <button key={key} type="button"
              onPointerDown={(event) => { event.preventDefault(); setControl(key, true); }}
              onPointerUp={() => setControl(key, false)}
              onPointerCancel={() => setControl(key, false)}
              onPointerLeave={() => setControl(key, false)}>{label}</button>
          ))}
          {hasGun && <button type="button" onPointerDown={(event) => {
            event.preventDefault();
            fireRequestedRef.current = true;
          }}>FIRE</button>}
        </div>
      </footer>
    </main>
  );
}

export default RaycastGame;
