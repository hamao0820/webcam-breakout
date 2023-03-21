import { Angle } from "./Ball";
import type Ball from "./Ball";
import { checkIntervalsIntersect } from "./Breakout";
import GameObject, { Bouncy, CollisionRect } from "./game";

class Paddle implements GameObject, Bouncy {
    x: number;
    readonly y: number;
    private readonly height: number;
    readonly width: number;
    readonly dxAbs = 7;
    dx: number;
    constructor(x: number, y: number, height: number, width: number) {
        if (height < 0 || width < 0) throw Error("height and width of paddle must be positive.");
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
        this.dx = 0;
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
    }
    accelerateToRight() {
        this.dx = this.dxAbs;
    }
    accelerateToLeft() {
        this.dx = 0 - this.dxAbs;
    }
    stop() {
        this.dx = 0;
    }

    move() {
        this.x += this.dx;
    }

    getCollisionRect(): CollisionRect {
        return { left: this.x, right: this.x + this.width, top: this.y, bottom: this.y + this.height };
    }

    isCollided(ball: Ball) {
        const ballCollisionRect = ball.getCollisionRect();
        const paddleCollisionRect = this.getCollisionRect();
        return (
            checkIntervalsIntersect(
                [ballCollisionRect.left, ballCollisionRect.right],
                [paddleCollisionRect.left, paddleCollisionRect.right]
            ) &&
            checkIntervalsIntersect(
                [ballCollisionRect.top, ballCollisionRect.bottom],
                [paddleCollisionRect.top, paddleCollisionRect.bottom]
            )
        );
    }

    bounce(ball: Ball) {
        if (this.isCollided(ball)) {
            const collidedPosition = ((ball.x - this.x - this.width / 2) * 2) / (2 * ball.radius + this.width); // [-1, 1]
            const angle = Angle.fromRadians(Math.PI / 2 - (Math.PI / 2) * collidedPosition * 0.8);
            ball.setAngle(angle);
            ball.accelerateToTop();
        }
    }
}

export default Paddle;
