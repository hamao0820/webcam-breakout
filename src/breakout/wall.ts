import Ball from './ball';
import GameObject, { Bouncy } from './game';

class Wall implements Bouncy {
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
    constructor(canvasWidth: number, canvasHeight: number) {
        this.top = 0;
        this.right = canvasWidth;
        this.bottom = canvasHeight;
        this.left = 0;
    }

    isCollided(object: GameObject) {
        const { top, left, right } = object.getCollisionRect();
        return left <= this.left || top <= this.top || right >= this.right;
    }

    isCollidedLeft(object: GameObject) {
        const { left } = object.getCollisionRect();
        return left <= this.left;
    }

    isCollidedRight(object: GameObject) {
        const { right } = object.getCollisionRect();
        return right >= this.right;
    }

    isCollidedBottom(object: GameObject) {
        const { bottom } = object.getCollisionRect();
        return bottom >= this.bottom;
    }

    bounce(ball: Ball) {
        const { top, left, right } = ball.getCollisionRect();
        if ((left <= this.left && ball.isFacingLeft()) || (right >= this.right && ball.isFacingRight())) {
            ball.reflectX();
        }
        if (top <= this.top) {
            ball.reflectY();
        }
    }
}

export default Wall;
