class Lives {
    readonly x: number;
    readonly y: number;
    lives: number;

    constructor(x: number, y: number, lives: number) {
        this.x = x;
        this.y = y;
        this.lives = lives;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.font = "16px Arial";
        ctx.fillStyle = "#0095DD";
        ctx.fillText(`Lives: ${this.lives}`, this.x, this.y);
    }
}

export default Lives;
