import Game from "./breakout";
import ControllerDataset from "./model/controller_dataset";
import Model from "./model/model";
import Ui from "./model/ui";
import Webcam from "./model/webcam";
import "./scss/style.scss";
import * as tf from "@tensorflow/tfjs";

class Main {
    private readonly webcam: Webcam;
    private readonly controllerDataset: ControllerDataset;
    private ui: Ui;
    constructor() {
        this.webcam = new Webcam();
        this.controllerDataset = new ControllerDataset(2);
        this.ui = new Ui(this.webcam);
    }

    async init() {
        await Model.init(this.webcam);
        if (Model.truncatedMobileNet instanceof Promise) throw Error();
        this.ui.init(this.train.bind(this), this.controllerDataset, Model.truncatedMobileNet);
    }

    private async  train(units: number) {
        if (!this.controllerDataset.xs || !this.controllerDataset.ys)
            throw Error("訓練データが存在しません。先にデータを追加してください。");
        const model = Model.build(units);

        const optimizer = tf.train.adam(this.ui.getLeaningRate());
        model.compile({ optimizer: optimizer, loss: "categoricalCrossentropy" });
        const batchSize = Math.floor(this.controllerDataset.dataSize * this.ui.getBatchSizeFraction());
        if (!(batchSize > 0)) {
            throw new Error(`Batch size is 0 or NaN. Please choose a non-zero fraction.`);
        }
        console.log("学習開始");
        await model.fit(this.controllerDataset.xs, this.controllerDataset.ys, {
            batchSize,
            epochs: this.ui.getEpochs(),
            callbacks: {
                onBatchEnd: async (batch: number, logs) => {
                    if (!logs) return;
                    this.ui.setTrainStatus("Loss: " + logs.loss.toFixed(5));
                },
            },
        });
        console.log("学習終了");
    }
}

(async () => {
    const main = new Main();
    await main.init();
    console.log("初期化完了");
})();
