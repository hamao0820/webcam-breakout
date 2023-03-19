import Webcam from "./webcam";
import * as tf from "@tensorflow/tfjs";
import type { ContainerArgs } from "@tensorflow/tfjs-layers/dist/engine/container";

export class TruncatedMobileNet extends tf.LayersModel {
    private constructor(args: ContainerArgs) {
        super(args);
    }

    static async build() {
        const mobilenet = await tf.loadLayersModel(
            "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json"
        );
        const layer = mobilenet.getLayer("conv_pw_13_relu");
        return new TruncatedMobileNet({ inputs: mobilenet.inputs, outputs: layer.output });
    }
}

class Model extends tf.Sequential {
    private static readonly NUM_CLASSES = 2;
    static #truncatedMobileNet: TruncatedMobileNet | Promise<TruncatedMobileNet> = TruncatedMobileNet.build();

    private constructor(truncatedMobileNet: TruncatedMobileNet, units: number) {
        super();
        this.add(tf.layers.flatten({ inputShape: truncatedMobileNet.outputs[0].shape.slice(1) }));
        this.add(
            tf.layers.dense({
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

    static build(units: number) {
        if (this.#truncatedMobileNet instanceof Promise)
            throw Error("初期化されていません. `Model.init(webcam: Webcam): Promise<void>`を実行してください。");
        return new Model(this.#truncatedMobileNet, units);
    }

    // Warm up the model. This uploads weights to the GPU and compiles the WebGL
    // programs so the first time we collect data from the webcam it will be
    // quick.
    static async init(webcam: Webcam) {
        this.#truncatedMobileNet = await this.#truncatedMobileNet;
        const screenShot = await webcam.getProcessedImage();
        this.#truncatedMobileNet.predict(screenShot);
        screenShot.dispose();
    }
    static get truncatedMobileNet() {
        return this.#truncatedMobileNet;
    }
}

export default Model;
