import type Ball from "./Ball";
import type Brick from "./Brick";
import type Lives from "./Lives";
import type Paddle from "./Paddle";
import type ScoreObject from "./Score";

class Renderer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    draw(ball: Ball, paddle: Paddle, bricks: Brick[][], score: ScoreObject, lives: Lives) {
        this.clear();
        ball.draw(this.ctx);
        paddle.draw(this.ctx);
        bricks.flat().forEach((brick) => brick.draw(this.ctx));
        score.draw(this.ctx);
        lives.draw(this.ctx);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

export default Renderer;
