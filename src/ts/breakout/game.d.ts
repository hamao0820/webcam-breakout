import Ball from './ball';

export default interface GameObject {
    x: number;
    y: number;
    draw: (ctx: CanvasRenderingContext2D) => void;
    getCollisionRect: () => CollisionRect;
}

interface Bouncy {
    bounce: (ball: Ball) => void;
}

export type CollisionRect = {
    left: number;
    right: number;
    top: number;
    bottom: number;
};
