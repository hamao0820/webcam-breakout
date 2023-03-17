import * as tf from "@tensorflow/tfjs";
import { ContainerArgs } from "@tensorflow/tfjs-layers/dist/engine/container";

class TruncatedMobileNet extends tf.LayersModel {
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
    private readonly truncatedMobileNet: TruncatedMobileNet;
    private constructor(truncatedMobileNet: TruncatedMobileNet, units: number) {
        super({
            layers: [
                tf.layers.flatten({ inputShape: truncatedMobileNet.outputs[0].shape.slice(1) }),
                tf.layers.dense({
                    units: units,
                    activation: "relu",
                    kernelInitializer: "varianceScaling",
                    useBias: true,
                }),
                tf.layers.dense({
                    units: Model.NUM_CLASSES,
                    kernelInitializer: "varianceScaling",
                    useBias: false,
                    activation: "softmax",
                }),
            ],
        });
        this.truncatedMobileNet = truncatedMobileNet;
    }

    static async build(units: number) {
        const truncatedMobileNet = await TruncatedMobileNet.build();
        return new Model(truncatedMobileNet, units);
    }

    // Warm up the model. This uploads weights to the GPU and compiles the WebGL
    // programs so the first time we collect data from the webcam it will be
    // quick.
    init(x: tf.Tensor<tf.Rank> | tf.Tensor<tf.Rank>[]) {
        this.truncatedMobileNet.predict(x);
    }
}

export default Model;
