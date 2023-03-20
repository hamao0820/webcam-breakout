import Lives from "./lives";
import Model from "./model";
import Renderer from "./renderer";
import { EventEmitter } from "events";

export const checkIntervalsIntersect = (
    [...interval1]: [number, number],
    [...interval2]: [number, number]
): boolean => {
    const sortedIntervals = [interval1, interval2].sort((a, b) => a[0] - b[0]);
    const [firstInterval, secondInterval] = sortedIntervals;

    return firstInterval[1] >= secondInterval[0];
};

export interface BreakoutEvent {
    step: {};
}

class Breakout extends EventEmitter {
    readonly canvas: HTMLCanvasElement;
    readonly ctx: CanvasRenderingContext2D;
    private readonly model: Model;
    private lives: Lives;
    private isDone: boolean;
    private readonly renderer: Renderer;
    constructor() {
        super();
        this.canvas = document.getElementById("game") as HTMLCanvasElement;
        if (!this.canvas) throw Error("canvasが存在しません");
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
        if (!this.ctx) throw Error("contextが存在しません.");
        this.model = new Model(this.canvas);
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.lives = new Lives(this.canvas.width - 65, 20, 2);

        this.renderer.draw(
            this.model.getBall(),
            this.model.getPaddle(),
            this.model.getBricks(),
            this.model.getScoreObject(),
            this.lives
        );

        this.isDone = false;
    }

    on<K extends keyof BreakoutEvent>(event: K, listener: (kwargs: BreakoutEvent[K]) => void): this {
        return super.on(event, (kwargs: BreakoutEvent[K]) => listener(kwargs));
    }

    emit<K extends keyof BreakoutEvent>(event: K, kwargs?: BreakoutEvent[K]) {
        return super.emit(event, kwargs);
    }

    removeAllListeners<K extends keyof BreakoutEvent>(event: K) {
        return super.removeAllListeners(event);
    }

    init() {
        this.removeAllListeners("step");
        return new Breakout();
    }

    private step() {
        if (this.isDone) return;
        this.model.update();
        this.emit("step");

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

    paddleOperate(classId: 0 | 1) {
        switch (classId) {
            case 0: {
                this.model.getPaddle().accelerateToLeft();
                break;
            }
            case 1: {
                this.model.getPaddle().accelerateToRight();
                break;
            }
            default:
                throw Error("classIdが不正です");
        }
    }
}

export default Breakout;
