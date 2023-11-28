import * as tf from "@tensorflow/tfjs";
import type { Tensor4D } from "@tensorflow/tfjs";

export class MobileNet extends tf.GraphModel {
    static async build() {
        const mobilenet = await tf.loadGraphModel(
            "https://www.kaggle.com/models/google/mobilenet-v3/frameworks/TfJs/variations/small-100-224-feature-vector/versions/1",
            { fromTFHub: true }
        );
        return mobilenet;
    }
}

class Model extends tf.Sequential {
    private static readonly NUM_CLASSES = 2;
    private static readonly mobileNetPromise: Promise<MobileNet> = MobileNet.build();
    private static mobileNet: MobileNet;

    private constructor(units: number) {
        super();
        this.add(
            tf.layers.dense({
                inputShape: [1024],
                units: units,
                activation: "relu",
                kernelInitializer: "varianceScaling",
                useBias: true,
            })
        );
        this.add(
            tf.layers.dense({
                units: Model.NUM_CLASSES,
                kernelInitializer: "varianceScaling",
                useBias: false,
                activation: "softmax",
            })
        );
    }

    static async load() {
        this.mobileNet = await this.mobileNetPromise;
    }

    static async build(units: number) {
        if (!this.isReady) throw Error("モデルがロードされていません");
        return new Model(units);
    }

    static embedding(image: Tensor4D) {
        return this.mobileNet.predict(image);
    }

    static isReady() {
        return !!this.mobileNet;
    }
}

export default Model;
