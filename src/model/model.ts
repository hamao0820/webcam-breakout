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
    private constructor(args: tf.SequentialArgs) {
        super(args);
    }

    static async build(units: number) {
        const truncatedMobileNet = await TruncatedMobileNet.build();
        return new Model({
            layers: [
                tf.layers.flatten({ inputShape: truncatedMobileNet.outputs[0].shape.slice(1) }),
                tf.layers.dense({
                    units: units,
                    activation: "relu",
                    kernelInitializer: "varianceScaling",
                    useBias: true,
                }),
                tf.layers.dense({
                    units: this.NUM_CLASSES,
                    kernelInitializer: "varianceScaling",
                    useBias: false,
                    activation: "softmax",
                }),
            ],
        });
    }
}

export default Model;
