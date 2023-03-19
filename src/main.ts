import Game from "./breakout";
import ModelController from "./model/ModelController";
import Model from "./model/model";
import Ui from "./model/ui";
import Webcam from "./model/webcam";
import "./scss/style.scss";
import * as tf from "@tensorflow/tfjs";
import type { Tensor1D } from "@tensorflow/tfjs";

class Main {
    private ui: Ui;
    private model?: tf.LayersModel;
    private readonly modelController: ModelController;

    constructor() {
        this.modelController = new ModelController();
        this.ui = new Ui(this.modelController);
    }

    async init() {
        await this.modelController.init()
        this.ui.doneLoading();
    }

}

(async () => {
    const main = new Main();
    await main.init();
    console.log("初期化完了");
})();
