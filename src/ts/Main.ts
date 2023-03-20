import Breakout from "./breakout/Breakout";
import ModelController from "./model/ModelController";
import Ui from "./model/Ui";
import "../scss/style.scss";

class Main {
    private readonly modelController: ModelController;
    private readonly ui: Ui;

    constructor() {
        const breakout = new Breakout();
        this.modelController = new ModelController();
        this.ui = new Ui(this.modelController, breakout);
    }

    async init() {
        await this.modelController.init();
    }
}

(async () => {
    const main = new Main();
    await main.init();
    console.log("初期化完了");
})();
