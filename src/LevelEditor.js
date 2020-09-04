import React, { useState } from 'react';
import Block from './Block';
import './levelEditor.css';
import Zombie from './Zombie';
import Gubbe from './Gubbe';

export default function LevelEditor(props) {
    const availableBlocks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22];
    const initialLevel = new Array(12).fill(new Array(24).fill(10));
    const [currentBlock, setCurrentBlock] = useState(1);
    const [currentLevel, setCurrentLevel] = useState(initialLevel);

    const setcurrentBlockAs = (x, y, newItem) => {
        const indexToUpdate = [y, x];
            
        const level = currentLevel.map((line, y) => line.map((block, x) => {
            if (indexToUpdate[0] === y && indexToUpdate[1] === x) return newItem;
            return block;
        }));
        setCurrentLevel(level);
    }

    const createDownload = () => {
        download('level.json', JSON.stringify({ blocks: currentLevel }).replace(/10/g, '0'));
    }

    const createUpload = (e) => {
        const file = e.target.files[0];
        getFileContents(file).then(json => {
            setCurrentLevel(JSON.parse(json.replace(/0/g, '10')).blocks);
        });
    }

    const level = currentLevel.map((line, y) => line.map((block, x) => [20, 21].includes(block) ? (block === 20 ? <Gubbe gubbeX={x} gubbeY={y} /> : <Zombie zombieX={x} zombieY={y} gubbeX={x} gubbeY={y} />) : <span onClick={() => setcurrentBlockAs(x, y, currentBlock)}><Block key={x+y} x={x} y={y} gubbeX={x+1} gubbeY={y+1} block={block} /></span>));
    return <div>
        <h1>Level editor</h1>
        <div className="level-editor">
            <div className="blocks-picker">
                <h3>Tillgängliga block: </h3>
                {availableBlocks.map(block => <div onClick={() => setCurrentBlock(block)} className="editor-block" style={currentBlock === block ? {border: '2px solid white'} : {}}>
                    <Block block={block} />
                </div>)}
            </div>
            <div className="blocks-picker">
                <h3>Tillgängliga gubbar: </h3>
                <div onClick={() => setCurrentBlock(20)} className="editor-block" style={currentBlock === 20 ? {border: '2px solid white'} : {}}>
                    <Gubbe /> 
                </div>
                <div onClick={() => setCurrentBlock(21)} className="editor-block" style={currentBlock === 21 ? {border: '2px solid white'} : {}}>
                    <Zombie />
                </div>
            </div>
            <div className="exitorandpreview">
                <div className="preview-level">
                    {level}
                </div>
                <div>
                    <button onClick={createDownload}>Ladda ner level-filen!</button>&nbsp;
                    <input
                        type="file" 
                        id="imageFile"
                        name='imageFile' 
                        onChange={createUpload} />
                    <button onClick={props.playGame}>Go to game!</button>
                </div>
            </div>
        </div>
    </div>
}

function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}

const getFileContents = (file) => {
    return new Promise((resolve,reject) => {
       const reader = new FileReader();
       reader.onload = () => resolve(reader.result);
       reader.onerror = error => reject(error);
       reader.readAsText(file);
    });
  }