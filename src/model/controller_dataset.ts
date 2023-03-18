import * as tf from "@tensorflow/tfjs";
import { Tensor4D, Tensor2D, Rank, Tensor } from "@tensorflow/tfjs";

class ControllerDataset {
    private readonly numClasses: number;
    private xs: Tensor4D | null;
    private ys: Tensor2D | null;
    constructor(numClasses: number) {
        this.numClasses = numClasses;
        this.xs = null;
        this.ys = null;
    }

    addExample(example: Tensor4D, label: number) {
        // One-hot encode the label.
        const y = tf.tidy(() => tf.oneHot(tf.tensor1d([label]).toInt(), this.numClasses)) as Tensor2D;

        if (!this.xs || !this.ys) {
            // For the first example that gets added, keep example and y so that the
            // ControllerDataset owns the memory of the inputs. This makes sure that
            // if addExample() is called in a tf.tidy(), these Tensors will not get
            // disposed.
            this.xs = tf.keep(example);
            this.ys = tf.keep(y);
        } else {
            const oldX = this.xs;
            this.xs = tf.keep(oldX.concat(example, 0));

            const oldY = this.ys;
            this.ys = tf.keep(oldY.concat(y, 0));

            oldX.dispose();
            oldY.dispose();
            y.dispose();
        }
    }
}

export default ControllerDataset;
