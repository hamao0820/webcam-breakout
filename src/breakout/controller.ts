import Paddle from './paddle';

class Controller {
    private readonly start: () => void;
    private readonly gameOver: () => void;
    private readonly paddle: Paddle;
    private readonly initGame: () => void;

    private readonly bindKeydownHandler: (e: KeyboardEvent) => void;
    private readonly bindKeyupHandler: (e: KeyboardEvent) => void;
    private readonly bindStart: () => void;
    private readonly bindRetry: () => void;

    private readonly startButton: HTMLButtonElement;
    private readonly retryButton: HTMLButtonElement;
    constructor(paddle: Paddle, start: () => void, gameOver: () => void, init: () => void) {
        this.paddle = paddle;
        this.start = start;
        this.gameOver = gameOver;
        this.initGame = init;

        this.bindKeydownHandler = this.keydownHandler.bind(this);
        this.bindKeyupHandler = this.keyupHandler.bind(this);
        this.bindStart = this.start.bind(this);
        this.bindRetry = this.retry.bind(this);

        const startButton = document.querySelector<HTMLButtonElement>('.start');
        const retryButton = document.querySelector<HTMLButtonElement>('.retry');
        if (!startButton) throw Error('startButton does not exist');
        if (!retryButton) throw Error('retryButton does not exist');
        this.startButton = startButton;
        this.retryButton = retryButton;
    }

    init() {
        document.addEventListener('keydown', this.bindKeydownHandler);
        document.addEventListener('keyup', this.bindKeyupHandler);
        this.startButton.addEventListener('click', this.bindStart, { once: true });
        this.startButton.addEventListener(
            'click',
            () => {
                this.startButton.setAttribute('disabled', 'true');
                this.retryButton.removeAttribute('disabled');
            },
            { once: true }
        );
        this.retryButton.addEventListener('click', this.bindRetry, { once: true });
        this.retryButton.addEventListener(
            'click',
            () => {
                this.startButton.removeAttribute('disabled');
                this.retryButton.setAttribute('disabled', 'true');
            },
            { once: true }
        );
    }

    reset() {
        document.removeEventListener('keydown', this.bindKeydownHandler);
        document.removeEventListener('keyup', this.bindKeyupHandler);
        this.retryButton.removeEventListener('click', this.bindRetry);
        this.startButton.removeEventListener('click', this.bindStart);
    }

    private retry() {
        this.gameOver();
        this.reset();
        this.init();
        this.initGame();
    }

    private keydownHandler(e: KeyboardEvent) {
        switch (e.key) {
            case 'Right':
            case 'ArrowRight': {
                this.paddle.accelerateToRight();
                break;
            }
            case 'Left':
            case 'ArrowLeft': {
                this.paddle.accelerateToLeft();
                break;
            }
            default:
                break;
        }
    }

    private keyupHandler(e: KeyboardEvent) {
        switch (e.key) {
            case 'Right':
            case 'ArrowRight': {
                this.paddle.stop();
                break;
            }
            case 'Left':
            case 'ArrowLeft': {
                this.paddle.stop();
                break;
            }
            default:
                break;
        }
    }
}

export default Controller;
