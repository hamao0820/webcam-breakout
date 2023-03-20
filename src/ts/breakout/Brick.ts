import Ball from "./Ball"
import GameObject, { Bouncy } from './game';
import { checkIntervalsIntersect } from './Breakout';

class Brick implements GameObject, Bouncy {
    x: number;
    y: number;
    readonly width: number;
    readonly height: number;
    isRemain: boolean;
    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isRemain = true;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.isRemain) return;
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#0095DD';
        ctx.fill();
        ctx.closePath();
    }

    getCollisionRect() {
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
        if (
            (ball.x <= this.getCollisionRect().left && ball.isFacingRight()) ||
            (ball.x >= this.getCollisionRect().right && ball.isFacingLeft())
        ) {
            ball.reflectX();
        }
        if (
            (ball.y <= this.getCollisionRect().top && ball.isFacingBottom()) ||
            (ball.y >= this.getCollisionRect().bottom && ball.isFacingTop())
        ) {
            ball.reflectY();
        }
    }
}

export default Brick;
