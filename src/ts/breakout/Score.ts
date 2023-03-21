class ScoreObject {
    x: number;
    y: number;
    score: Score;
    constructor(x: number, y: number, score: Score) {
        this.x = x;
        this.y = y;
        this.score = score;
    }

    add(added: Score) {
        this.score = this.score.add(added);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.font = "16px Arial";
        ctx.fillStyle = "#0095DD";
        ctx.fillText(`Score: ${this.score.value}`, this.x, this.y);
    }
}

export class Score {
    private static readonly INITIAL_SCORE = 0;
    private static readonly BASE_SCORE = 1;
    private static readonly ALL_CLEAR_BONUS = 10;
    readonly value: number;
    private constructor(score: number) {
        this.value = score;
    }

    static forInitialScore() {
        return new Score(this.INITIAL_SCORE);
    }
    static forBaseScore() {
        return new Score(this.BASE_SCORE);
    }
    static forAllClearBonus() {
        return new Score(this.ALL_CLEAR_BONUS);
    }

    add(added: Score) {
        return new Score(this.value + added.value);
    }
}

export default ScoreObject;
