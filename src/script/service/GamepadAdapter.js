import t from 'tcomb';
import {
    reduce,
    map,
    filter,
    toArray
} from 'lodash';

const EVENTS = {
    DID_CONNECT: 'gamepadconnected',
    DID_DISCONNECT: 'gamepaddisconnected'
};

export default class GamePadAdapter {
    constructor() {
        if (t.Nil.is(window.navigator.getGamepads)) {
            throw new TypeError('Gamepad API is not supported');
        }

        window.addEventListener(EVENTS.DID_CONNECT, this.onGamepadConnect);
        window.addEventListener(EVENTS.DID_DISCONNECT, this.onGamepadDisconnect);
    }

    get gamepads() {
        return filter(
            window.navigator.getGamepads(),
            (gamepad) => !t.Nil.is(gamepad)
        );
    }

    getDebugGamepad() {
        return map(this.gamepads, (gamepad) => {
            const dpad = '(' + gamepad.axes.join(', ') + ')';
            const buttons = reduce(gamepad.buttons, (buttonStr, button, index) => {
                let value = button.value;
                if (!value) {
                    value = button.pressed;
                }

                return `${buttonStr} ${index}: ${value}`;
            }, '');

            return `${gamepad.id}\nDpad ${dpad}\n${buttons}`;
        });
    }

    onGamepadConnect = (event) => {
        const gamepad = event.gamepad;
        console.log(gamepad);
    };

    onGamepadDisconnect = (event) => {
        const gamepad = event.gamepad;
        console.log(gamepad);
    };
}
