import Breakout from "./breakout/Breakout";
import ModelController from "./model/ModelController";
import Model from "./model/model";
import Ui from "./model/ui";
import "./scss/style.scss";
import * as tf from "@tensorflow/tfjs";
import type { Tensor1D } from "@tensorflow/tfjs";

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
