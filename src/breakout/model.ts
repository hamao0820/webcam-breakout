import Ball from './ball';
import Paddle from './paddle';
import Brick from './brick';
import ScoreObject, { Score } from './score';
import Wall from './wall';

const createBricks = () => {
    const bricks: Brick[][] = [];
    const offsetTop = 30;
    const offsetLeft = 30;
    const brickWidth = 75;
    const brickHeight = 20;
    const columnCount = 5;
    const rawCount = 3;
    const padding = 10;
    for (let c = 0; c < columnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < rawCount; r++) {
            const x = c * (brickWidth + padding) + offsetLeft;
            const y = r * (brickHeight + padding) + offsetTop;
            bricks[c][r] = new Brick(x, y, brickWidth, brickHeight);
        }
    }
    return bricks;
};

class Model {
    private ball: Ball;
    private readonly paddle: Paddle;
    private bricks: Brick[][];
    private readonly wall: Wall;
    private readonly scoreObject: ScoreObject;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        this.ball = Ball.forInitialize(canvas);

        const paddleHeight = 10;
        const paddleWidth = 75;
        const paddleStartX = (canvasWidth - paddleWidth) / 2;
        const paddleStartY = canvasHeight - paddleHeight - 10;
        this.paddle = new Paddle(paddleStartX, paddleStartY, paddleHeight, paddleWidth);

        this.bricks = createBricks();

        this.wall = new Wall(canvasWidth, canvasHeight);

        const scoreObjectX = 8;
        const scoreObjectY = 20;
        this.scoreObject = new ScoreObject(scoreObjectX, scoreObjectY, Score.forInitialScore());
    }

    update() {
        this.processCollision();
        this.ball.move();
        this.paddle.move();
    }

    private processCollision(): void {
        // Ball and wall
        if (this.wall.isCollided(this.ball)) {
            this.wall.bounce(this.ball);
        }

        // Paddle adn wall
        if (
            (this.wall.isCollidedLeft(this.paddle) && this.paddle.dx < 0) ||
            (this.wall.isCollidedRight(this.paddle) && this.paddle.dx > 0)
        ) {
            this.paddle.stop();
        }

        // Ball and paddle
        if (this.paddle.isCollided(this.ball)) {
            this.paddle.bounce(this.ball);
            this.ball.activate();
        }

        // Ball and bricks
        if (!this.ball.isActive) return;
        for (const brick of this.bricks.flat()) {
            if (!brick.isRemain) continue;
            if (brick.isCollided(this.ball)) {
                brick.bounce(this.ball);
                this.ball.accelerate(0.1);
                this.scoreObject.add(Score.forBaseScore());
                brick.isRemain = false;
                if (this.isAllClear()) {
                    this.scoreObject.score = this.scoreObject.score.add(Score.forAllClearBonus());
                    this.ball.accelerate(0.5);
                    this.ball.deactivate();
                    setTimeout(() => {
                        this.bricks = createBricks();
                    }, 500);
                }
                break;
            }
        }
    }

    isGameOver() {
        return this.wall.isCollidedBottom(this.ball);
    }

    isAllClear() {
        return this.bricks.flat().every((brick) => !brick.isRemain);
    }

    getBall() {
        return this.ball;
    }

    initBall() {
        this.ball = Ball.forInitialize(this.canvas);
    }

    getPaddle() {
        return this.paddle;
    }

    getBricks() {
        return this.bricks;
    }

    getScoreObject() {
        return this.scoreObject;
    }
}

export default Model;
