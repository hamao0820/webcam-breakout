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

    constructor() {
        this.webcam = new Webcam();
        const modelController = new ModelController(this.webcam);
        this.ui = new Ui(this.webcam, modelController);
    }

    async init() {
        await Model.init(this.webcam);
        if (!Model.isInitialized()) throw Error("モデルが初期化されていません");
        this.ui.doneLoading();
        this.ui.init(this.predict.bind(this));
    }

    private async build(units: number) {
        this.model = Model.build(units);
    }

    private async predict() {
        const image = await this.webcam.getProcessedImage();
        if (!this.model) throw Error("先に学習をしてください。`model.train(units: number)`");
        const predictions = this.model.predict(Model.embedding(image)) as Tensor1D;
        const classId = tf.tidy(() => predictions.as1D().argMax().dataSync());
        image.dispose();
        predictions.dispose();

        return classId;
    }
}

(async () => {
    const main = new Main();
    await main.init();
    console.log("初期化完了");
})();
