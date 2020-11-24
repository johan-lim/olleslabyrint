import React, { useState } from 'react';
import GameEngine from './GameEngine';
import LevelEditor from './LevelEditor';
import SplashScreen from './SplashScreen';
import EndScreen from './EndScreen';
import { play } from './Audio';
import './App.css';


window.addEventListener('beforeinstallprompt', (e) => {
    e.prompt();
});

function App() {
  const [gameMode, setGameMode] = useState('splash');
  const [multiPlayerRoom, setMultiPlayerRoom] = useState('');
  const [playerName, setPlayerName] = useState('');

  const playGame = () => {
    play.play();
    setGameMode('game');
  }

  const finishGame = () => {
    setGameMode('end');
  }

  const gotoEditor = () => {
    setGameMode('editor');
  }

  const updateMultiPlayerRoom = (e) => setMultiPlayerRoom(e.target.value);
  
  return (
    <div className="App">
        {gameMode === 'splash' &&
          <SplashScreen
            playGame={playGame}
            updateMultiPlayerRoom={updateMultiPlayerRoom}
            multiPlayerRoom={multiPlayerRoom}
            playerName={playerName}
            setPlayerName={setPlayerName}
          />}
        {gameMode === 'game' &&
          <GameEngine
            gotoEditor={gotoEditor}
            finishGame={finishGame}
            multiPlayerRoom={multiPlayerRoom}
            playerName={playerName}
          />}
        {gameMode === 'editor' && <LevelEditor playGame={playGame} />}
        {gameMode === 'end' && <EndScreen />}
    </div>
  );
}

export default App;
