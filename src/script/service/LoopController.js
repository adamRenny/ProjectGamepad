import t from 'tcomb';

/**
 * Helper function to acquire the current time
 *
 * @function getCurrentTime
 * @return {number} Unix Timestamp in milliseconds
 */
const getCurrentTime = () => {
    return (new Date()).getTime();
};

/**
 * Invalid request ID used to denote an unscheduled request time
 * Used to set and denote when a request has not been made
 *
 * @final
 * @private
 * @property INVALID_REQUEST_ID
 * @type {number}
 */
const INVALID_REQUEST_ID = -1;

/**
 * Target framerate of the run loop in milliseconds
 *
 * @final
 * @private
 * @property FRAMERATE
 * @type {number}
 */
const FRAMERATE = 1000/60;

/**
 * Maximum number of frames allowed for a single step of the controller
 *
 * @final
 * @private
 * @property ALLOWED_OVERFLOW_FRAMES
 * @type {number}
 */
const ALLOWED_OVERFLOW_FRAMES = 10;

/**
 * Controller that brokers and manages the run loop
 *
 * @class LoopController
 */
export default class LoopController {
    /**
     * Flag used to denote whether the controller is currently running
     * Is marked as running whenever the loop controller has started
     * Is a mutually exclusive event to isPaused
     *
     * @readonly
     * @for LoopController
     * @property isRunning
     * @type {boolean}
     */
    isRunning = false;

    /**
     * Flag used to denote whether the controller is paused during the current run
     * Is marked as paused whenever the loop controller is running, and a it has been paused
     *
     * @readonly
     * @for LoopController
     * @property isPaused
     * @type {boolean}
     */
    isPaused = false;

    /**
     * Ordered list of steps/operations/functions performed during each loop over the full step
     * Update steps will be called with the following signature
     *
     *   void updateStep(number elapsedTime)
     *
     * Each operation will be performed in an update step, which may or may not be bound to the render step
     *
     * Management for the steps should be performed directly on this property
     *
     * @for LoopController
     * @property updateSteps
     * @type {function[]}
     */
    updateSteps = [];

    /**
     * Ordered list of steps/operations performed during each loop over the full step
     * Update steps will be called with the following signature
     *
     *   void renderStep()
     *
     * Each operation will be performed on the refresh rate, and are executed on requestAnimationFrame
     *
     * Management for the steps should be performed directly on this property
     *
     * @for LoopController
     * @property renderSteps
     * @type {function[]}
     */
    renderSteps = [];

    /**
     * Unix timestamp for the start time of the loop
     * Is set when start is called, and is not paused
     *
     * @readonly
     * @for LoopController
     * @property startTimestamp
     * @type {number}
     */
    startTimestamp = 0;

    /**
     * Unix timestamp for the previous iteration of the loop
     * Set during each step of the loop
     *
     * @readonly
     * @for LoopController
     * @property lastTimestamp
     * @type {number}
     */
    lastTimestamp = 0;

    /**
     * Elapsed time since the beginning of the start call, including any pauses
     *
     * @readonly
     * @for LoopController
     * @property elapsedTimeInMilliseconds
     * @type {number}
     */
    elapsedTimeInMilliseconds = 0;

    /**
     * Current frame request ID of the currently running requestAnimationFrame call
     *
     * @private
     * @for LoopController
     * @property frameRequestId
     * @type {number}
     */
    frameRequestId = INVALID_REQUEST_ID;

    /**
     * Frame request function
     * Passed in via dependency injection
     * Used to store methods like requestAnimationFrame and setTimeout
     *
     * @private
     * @for LoopController
     * @property requestFrame
     * @type {function}
     */
    requestFrame = () => {};

    /**
     * Threshold in milliseconds allowed to be missed before considering the frame a "dead" frame
     * Dead frames are ignored in the event that something has caused the animation frame to delay
     * or if the system is running too slow
     */
    allowedOverflowThreshold = Math.round(ALLOWED_OVERFLOW_FRAMES * FRAMERATE);

    /**
     * Constructor for the loop controller
     *
     * @for LoopController
     * @constructor
     * @param {function} requestFrame Function used to request the next frame of the monitor
     * @param {number} allowedOverflowFrames Number of frames allowed to pass per step, in a 60fps environment
     */
    constructor(
        requestFrame = requestAnimationFrame,
        allowedOverflowFrames = ALLOWED_OVERFLOW_FRAMES
    ) {
        if (!t.Function.is(requestFrame)) {
            throw new TypeError('Expected the requestFrame method to be a function');
        }

        if (!t.Number.is(allowedOverflowFrames)) {
            throw new TypeError('Expected the allowedOverflowFrames to be a number');
        }

        this.requestFrame = requestFrame;
        this.allowedOverflowThreshold = Math.round(allowedOverflowFrames * FRAMERATE);
    }

    /**
     * Starts the loop controller to begin running the loop controller
     *
     * Will ignore additional calls after the first, unless the loop controller has ended
     *
     * @for LoopController
     * @method start
     */
    start() {
        if (this.isRunning) {
            return;
        }

        this.frameRequestId = this.requestFrame(this.step);

        const currentTimestamp = getCurrentTime();
        if (!this.isPaused) {
            this.startTimestamp = currentTimestamp;
        }
            
        this.lastTimestamp = currentTimestamp;

        this.isPaused = false;
        this.isRunning = true;
    }

    /**
     * Stops the loop controller to end the current loop runtime
     *
     * Cancels the runtime
     * Once the controller is stopped, the elapsed time and start timestamp
     * will be reset when it is start again
     *
     * @for LoopController
     * @method stop
     */
    stop() {
        if (!this.isRunning || this.frameRequestId === INVALID_REQUEST_ID) {
            return;
        }

        cancelAnimationFrame(this.frameRequestId);
        this.frameRequestId = INVALID_REQUEST_ID;

        this.isRunning = false;
    }

    /**
     * Pauses the loop controller on the current loop runtime
     *
     * Temporarily stops the runtime
     * Once the controller is paused, the elapsed time and start timestamp are retained
     *
     * Doesn't pause once already paused
     *
     * @for LoopController
     * @method pause
     */
    pause() {
        if (!this.isRunning || this.isPaused) {
            return;
        }

        this.stop();

        this.isPaused = true;

    }

    /**
     * Update step to perform any calculations for the next render step
     *
     * Performed during step before the next render
     *
     * @private
     * @for LoopController
     * @method update
     * @param {number} elapsedTimeInMilliseconds Number of milliseconds since the last step
     */
    update(elapsedTimeInMilliseconds) {
        const { updateSteps } = this;
        const steps = [ ...updateSteps ];
        const { length } = steps;
        for (let i = 0; i < length; i++) {
            steps[i](elapsedTimeInMilliseconds);
        }
    }

    /**
     * Render step to perform rendering on the step
     *
     * Should do any drawing/rendering logic on this step
     *
     * @private
     * @for LoopController
     * @method render
     */
    render() {
        const { renderSteps } = this;
        const steps = [ ...renderSteps ];
        const { length } = steps;
        for (let i = 0; i < length; i++) {
            steps[i]();
        }
    }

    /**
     * Next iteration in the loop
     *
     * Used to perform calculations for the next step in the render loop
     *
     * Will not update/render the next step if the time since the last step is greater than the 
     * defined threshold
     *
     * Called during an asynchronous step, should be on the UI Thread
     *
     * @private
     * @for LoopController
     * @method step
     */
    step = () => {
        const {
            isRunning,
            isPaused,
            allowedOverflowThreshold,
            requestFrame
        } = this;
        
        if (!isRunning || this.isPaused) {
            return;
        }

        this.frameRequestId = requestFrame(this.step);

        const currentTimestamp = getCurrentTime();
        const elapsedTime = currentTimestamp - this.lastTimestamp;
        if (elapsedTime > allowedOverflowThreshold) {
            this.lastTimestamp = currentTimestamp;
            return;
        }

        this.elapsedTimeInMilliseconds = this.elapsedTimeInMilliseconds + elapsedTime;

        this.update(elapsedTime);
        this.render();

        this.lastTimestamp = currentTimestamp;
    };
};
