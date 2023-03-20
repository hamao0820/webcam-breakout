import ControllerDataset from "./Dataset";
import Model from "./Model";
import * as tf from "@tensorflow/tfjs";
import type { Tensor1D, Tensor4D } from "@tensorflow/tfjs";
import { EventEmitter } from "events";

export interface ModelControllerEvent {
    batchEnd: { loss: string };
    trainDone: {};
    modelInit: {};
    predict: { classId: 0 | 1 };
}

class ModelController extends EventEmitter {
    private model: Model | null = null;
    private readonly controllerDataset: ControllerDataset;
    constructor() {
        super();
        this.controllerDataset = new ControllerDataset(2);
    }

    async load() {
        await Model.load();
        console.log("mobileNetの読み込みが完了しました");
        this.emit("modelInit");
    }

    // Warm up the model. This uploads weights to the GPU and compiles the WebGL
    // programs so the first time we collect data from the webcam it will be
    // quick.
    async init() {
        await this.load();
        const model = await Model.build(1);
        if (!model) throw Error("modelがロードされていません");
        const randomImage: Tensor4D = tf.randomNormal([1, 224, 224, 3]);
        Model.embedding(randomImage);
        randomImage.dispose();
    }

    on<K extends keyof ModelControllerEvent>(event: K, listener: (kwargs: ModelControllerEvent[K]) => void): this {
        return super.on(event, (kwargs: ModelControllerEvent[K]) => listener(kwargs));
    }

    emit<K extends keyof ModelControllerEvent>(event: K, kwargs?: ModelControllerEvent[K]) {
        return super.emit(event, kwargs);
    }

    embedding(image: tf.Tensor4D) {
        if (!Model.isReady) throw Error("modelが初期化されていません");
        return Model.embedding(image);
    }

    addTrainData(image: Tensor4D, label: number) {
        this.controllerDataset.addTrainData(this.embedding(image) as Tensor4D, label);
    }

    getClassSizes(label: number) {
        return this.controllerDataset.classSizes[label];
    }

    async train(units: number, learningRate: number, batchSizeFraction: number, epochs: number) {
        this.model = await Model.build(units);
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
                    this.emit("batchEnd", { loss: logs.loss.toFixed(5) });
                },
            },
        });
        console.log("学習終了");
        this.emit("trainDone");
    }

    async predict(image: Tensor4D) {
        if (!this.model) throw Error("先に学習をしてください。`model.train(units: number)`");
        const predictions = this.model.predict(Model.embedding(image)) as Tensor1D;
        const classId = tf.tidy(() => Number(predictions.as1D().argMax().dataSync()));
        predictions.dispose();
        if (classId !== 0 && classId !== 1) throw Error("classIdが不正です");
        this.emit("predict", { classId: classId });
    }

    resetDataset() {
        this.controllerDataset.reset();
    }
}
export default ModelController;
