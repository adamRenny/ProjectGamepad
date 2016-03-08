
const getCurrentTime = () => {
    return (new Date()).getTime();
}

const INVALID_REQUEST_ID = -1;

const FRAMERATE = 1000/60;

const OVERFLOW_THRESHOLD = Math.round(FRAMERATE * 10);

export default class LoopController {
    isRunning = false;
    updateSteps = [];
    renderSteps = [];

    startTimestamp = 0;
    lastTimestamp = 0;
    elapsedTimeInMilliseconds = 0;

    frameRequestId = INVALID_REQUEST_ID;

    constructor() {

    }

    start() {
        if (this.isRunning) {
            return;
        }

        this.frameRequestId = requestAnimationFrame(this.step);

        const currentTimestamp = getCurrentTime();
        if (!this.isPaused) {
            this.startTimestamp = currentTimestamp;
        }
            
        this.lastTimestamp = currentTimestamp;

        this.isPaused = false;
        this.isRunning = true;
    }

    stop() {
        if (!this.isRunning || this.frameRequestId === INVALID_REQUEST_ID) {
            return;
        }

        cancelAnimationFrame(this.frameRequestId);
        this.frameRequestId = INVALID_REQUEST_ID;

        this.isRunning = false;
    }

    pause() {
        this.stop();

        this.isPaused = true;

    }

    update(elapsedTimeInMilliseconds) {
        const { updateSteps } = this;
        const { length } = updateSteps;
        for (let i = 0; i < length; i++) {
            updateSteps[i](elapsedTimeInMilliseconds);
        }
    }

    render() {
        const { renderSteps } = this;
        const { length } = renderSteps;
        for (let i = 0; i < length; i++) {
            renderSteps[i]();
        }
    }

    step = () => {
        const {
            isRunning,
            isPaused
        } = this;
        
        if (!isRunning || this.isPaused) {
            return;
        }

        this.frameRequestId = requestAnimationFrame(this.step);

        const currentTimestamp = getCurrentTime();
        const elapsedTime = currentTimestamp - this.lastTimestamp;
        if (elapsedTime > OVERFLOW_THRESHOLD) {
            this.lastTimestamp = currentTimestamp;
            return;
        }

        this.elapsedTimeInMilliseconds = this.elapsedTimeInMilliseconds + elapsedTime;

        this.update(elapsedTime);
        this.render();

        this.lastTimestamp = currentTimestamp;
    };
};
