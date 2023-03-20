import * as tf from "@tensorflow/tfjs";
import type { Tensor4D } from "@tensorflow/tfjs";
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
    private static readonly truncatedMobileNetPromise: Promise<TruncatedMobileNet> = TruncatedMobileNet.build();
    private static truncatedMobileNet: TruncatedMobileNet;

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

    static async load() {
        this.truncatedMobileNet = await this.truncatedMobileNetPromise;
    }

    static async build(units: number) {
        if (!this.isReady) throw Error("モデルがロードされていません");
        return new Model(this.truncatedMobileNet, units);
    }

    static embedding(image: Tensor4D) {
        return this.truncatedMobileNet.predict(image);
    }

    static isReady() {
        return !!this.truncatedMobileNet;
    }
}

export default Model;
