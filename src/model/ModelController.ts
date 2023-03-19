import ControllerDataset from "./controller_dataset";
import Model from "./model";
import Webcam from "./webcam";
import { LayersModel } from "@tensorflow/tfjs";
import * as tf from "@tensorflow/tfjs";
import { EventEmitter } from "events";

class ModelController extends EventEmitter {
    private model: LayersModel | null = null;
    readonly controllerDataset: ControllerDataset;
    constructor(webcam: Webcam) {
        super();
        Model.init(webcam).then(() => {
            console.log("mobileNetの読み込みが完了しました");
        });
        this.controllerDataset = new ControllerDataset(2);
    }

    embedding(image: tf.Tensor4D) {
        return Model.embedding(image);
    }

    async train(units: number, learningRate: number, batchSizeFraction: number, epochs: number) {
        this.model = Model.build(units);
        if (!this.model) throw Error("先にビルドをしてください。`modelController.build(units: number)`");

        if (!this.controllerDataset.xs || !this.controllerDataset.ys)
            throw Error("訓練データが存在しません。先にデータを追加してください。");

        const optimizer = tf.train.adam(learningRate);
        this.model.compile({ optimizer: optimizer, loss: "categoricalCrossentropy" });
        const batchSize = Math.max(Math.floor(this.controllerDataset.dataSize * batchSizeFraction), 1);
        if (!(batchSize > 0)) {
            throw new Error(`Batch size is 0 or NaN. Please choose a non-zero fraction.`);
        }
        console.log("学習開始");
        await this.model.fit(this.controllerDataset.xs, this.controllerDataset.ys, {
            batchSize,
            epochs: epochs,
            callbacks: {
                onBatchEnd: async (batch: number, logs) => {
                    if (!logs) return;
                    console.log(batch);
                    // this.emit("batchEnd", logs.loss.toFixed(5));
                    // this.ui.setTrainStatus("Loss: " + logs.loss.toFixed(5));
                },
            },
        });
        console.log("学習終了");
    }
}
export default ModelController;
