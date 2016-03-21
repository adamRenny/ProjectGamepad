import KeyEntry from './component/KeyEntry';

import React from 'react';
import ReactDOM from 'react-dom';

import GamepadAdapter from './service/GamepadAdapter';
import LoopController from './service/LoopController';

const adapter = new GamepadAdapter();

const updateStep = (elapsed) => {
    console.log('updating', elapsed);
};

const loop = new LoopController(
    (callback) => window.requestAnimationFrame(callback)
);
loop.updateSteps = [
    ...loop.updateSteps.slice(0),
    updateStep
];

loop.start();

window.loop = loop;

ReactDOM.render(
    <KeyEntry keyName="fire" />,
    document.getElementById('root')
);
