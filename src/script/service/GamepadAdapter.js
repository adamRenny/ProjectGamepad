import t from 'tcomb';
import {
    reduce,
    map,
    filter,
    findIndex,
} from 'lodash';

const EVENTS = {
    DID_CONNECT: 'gamepadconnected',
    DID_DISCONNECT: 'gamepaddisconnected'
};

export default class GamePadAdapter {
    connectedIds = [];

    constructor() {
        if (t.Nil.is(window.navigator.getGamepads)) {
            throw new TypeError('Gamepad API is not supported');
        }

        this.updateConnectedGamepads();

        window.addEventListener(EVENTS.DID_CONNECT, this.onGamepadConnect);
        window.addEventListener(EVENTS.DID_DISCONNECT, this.onGamepadDisconnect);
    }

    updateConnectedGamepads() {
        this.connectedIds = map(
            filter(
                window.navigator.getGamepads(),
                (gamepad) => !t.Nil.is(gamepad) && gamepad.connected
            ),
            (gamepad) => {
                return gamepad.id
            }
        );
    }

    /**
     * Must pull from the current gamepad list in order to get
     */
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
        this.updateConnectedGamepads();
    };

    onGamepadDisconnect = (event) => {
        this.updateConnectedGamepads();
    };
}
