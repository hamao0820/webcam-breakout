import Controller from "./controller";
import Lives from "./lives";
import Model from "./model";
import Renderer from "./renderer";

export const checkIntervalsIntersect = (
    [...interval1]: [number, number],
    [...interval2]: [number, number]
): boolean => {
    const sortedIntervals = [interval1, interval2].sort((a, b) => a[0] - b[0]);
    const [firstInterval, secondInterval] = sortedIntervals;

    return firstInterval[1] >= secondInterval[0];
};

class Game {
    readonly canvas: HTMLCanvasElement;
    readonly ctx: CanvasRenderingContext2D;
    private readonly model: Model;
    private lives: Lives;
    private isDone: boolean;
    private readonly renderer: Renderer;
    private readonly controller: Controller;
    constructor() {
        this.canvas = document.getElementById("game") as HTMLCanvasElement;
        if (!this.canvas) throw Error("canvasが存在しません");
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
        if (!this.ctx) throw Error("contextが存在しません.");
        this.model = new Model(this.canvas);
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.controller = new Controller(
            this.model.getPaddle(),
            () => this.start(),
            () => this.gameOver(),
            () => this.init()
        );
        this.lives = new Lives(this.canvas.width - 65, 20, 2);

        this.renderer.draw(
            this.model.getBall(),
            this.model.getPaddle(),
            this.model.getBricks(),
            this.model.getScoreObject(),
            this.lives
        );

        this.isDone = false;

        this.controller.init();
    }

    init() {
        this.controller.reset();
        new Game();
    }

    private step() {
        if (this.isDone) return;
        this.model.update();
        this.renderer.draw(
            this.model.getBall(),
            this.model.getPaddle(),
            this.model.getBricks(),
            this.model.getScoreObject(),
            this.lives
        );
        if (this.model.isGameOver()) {
            this.lives.lives -= 1;
            if (this.lives.lives <= 0) {
                this.gameOver();
                return;
            }
            this.model.initBall();
        }
        requestAnimationFrame(() => {
            this.step();
        });
    }

    start() {
        this.step();
    }

    gameOver() {
        this.isDone = true;
        console.log("GAME OVER");
    }
}

export default Game;
