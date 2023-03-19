import Game from "./breakout";
import ModelController from "./model/ModelController";
import Model from "./model/model";
import Ui from "./model/ui";
import Webcam from "./model/webcam";
import "./scss/style.scss";
import * as tf from "@tensorflow/tfjs";
import type { Tensor1D } from "@tensorflow/tfjs";

class Main {
    private readonly webcam: Webcam;
    private ui: Ui;
    private model?: tf.LayersModel;
    private readonly modelController: ModelController;

    constructor() {
        this.webcam = new Webcam();
        this.modelController = new ModelController(this.webcam);
        this.ui = new Ui(this.webcam, this.modelController);
    }

    async init() {
        // await Model.init(this.webcam);
        // if (!Model.isInitialized()) throw Error("モデルが初期化されていません");
        this.ui.doneLoading();
    }

    private async build(units: number) {
        this.model = Model.build(units);
    }
}

(async () => {
    const main = new Main();
    await main.init();
    console.log("初期化完了");
})();
