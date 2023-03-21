import type GameObject from "./game";

class Ball implements GameObject {
    x: number;
    y: number;
    v: number;
    angle: Angle;
    readonly radius;
    private active: boolean;
    private constructor(x: number, y: number, v: number, angle: Angle, radius: number) {
        if (v < 0) throw Error('"v" must be positive');
        this.x = x;
        this.y = y;
        this.v = v;
        this.angle = angle;
        this.radius = radius;
        this.active = true;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.active ? "#0095DD" : "rgba(0,149,221,0.55)";
        ctx.fill();
        ctx.closePath();
        return;
    }

    reflectX() {
        this.angle = this.angle.reverseCos();
    }

    reflectY() {
        this.angle = this.angle.reverseSin();
    }

    accelerateToTop() {
        this.angle = this.angle.getAbsoluteSin();
    }

    move() {
        this.x += this.v * this.angle.calculateCos();
        this.y -= this.v * this.angle.calculateSin();
    }

    getCollisionRect() {
        const left = this.x - this.radius;
        const right = this.x + this.radius;
        const top = this.y - this.radius;
        const bottom = this.y + this.radius;
        return { left, right, top, bottom };
    }

    setAngle(angle: Angle) {
        this.angle = angle;
    }

    get isActive() {
        return this.active;
    }

    activate() {
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }

    accelerate(v: number) {
        this.v += v;
    }

    isFacingRight() {
        return this.angle.getRadians() <= Math.PI / 2 || this.angle.getRadians() >= (Math.PI * 3) / 2;
    }

    isFacingLeft() {
        return this.angle.getRadians() >= Math.PI / 2 && this.angle.getRadians() <= (Math.PI * 3) / 2;
    }

    isFacingTop() {
        return this.angle.getRadians() <= Math.PI;
    }

    isFacingBottom() {
        return this.angle.getRadians() >= Math.PI;
    }

    static forInitialize(canvas: HTMLCanvasElement) {
        const defaultRadius = 10;
        const defaultVelocity = 4;
        return new Ball(canvas.width / 2, canvas.height / 1.5, defaultVelocity, Angle.forInitialize(), defaultRadius);
    }
}

export class Angle {
    private radians: number;

    private constructor(radians: number) {
        this.radians = this.normalizeRadians(radians);
    }

    getRadians(): number {
        return this.normalizeRadians(this.radians);
    }

    setRadians(radians: number): void {
        this.radians = this.normalizeRadians(radians);
    }

    reverseCos() {
        return new Angle(Math.PI - this.radians);
    }

    reverseSin() {
        return new Angle(-1 * this.radians);
    }

    getAbsoluteSin() {
        const normalizedRadians = this.normalizeRadians(this.radians);
        if (0 <= normalizedRadians && normalizedRadians <= Math.PI) return new Angle(this.radians);
        if (Math.PI < normalizedRadians && normalizedRadians <= (Math.PI * 3) / 2)
            return new Angle(this.radians - Math.PI / 2);
        return new Angle(this.normalizeRadians(this.radians + Math.PI / 2));
    }

    calculateCos() {
        return Math.cos(this.radians);
    }

    calculateSin() {
        return Math.sin(this.radians);
    }

    private normalizeRadians(radians: number): number {
        while (radians < 0) {
            radians += 2 * Math.PI;
        }
        while (radians >= 2 * Math.PI) {
            radians -= 2 * Math.PI;
        }
        return radians;
    }

    static fromRadians(radians: number) {
        return new Angle(radians);
    }

    static forInitialize() {
        const radians =
            Math.random() > 0.5
                ? Math.PI * (1 / 2 - Math.random() * (3 / 8 - 1 / 8) + 1 / 8)
                : Math.PI * (1 / 2 + Math.random() * (3 / 8 - 1 / 8) + 1 / 8);
        return new Angle(radians);
    }
}

export default Ball;
