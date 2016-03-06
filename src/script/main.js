import KeyEntry from './component/KeyEntry';

import React from 'react';
import ReactDOM from 'react-dom';

import GamepadAdapter from './service/GamepadAdapter';

const adapter = new GamepadAdapter();

const step = () => {
    if (!window.shouldStop) {
        requestAnimationFrame(step);
    }

    console.log(...adapter.getDebugGamepad());
};

requestAnimationFrame(step);

ReactDOM.render(
    <KeyEntry keyName="fire" />,
    document.getElementById('root')
);
