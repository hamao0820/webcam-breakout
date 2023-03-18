import * as tf from "@tensorflow/tfjs";
import { Tensor4D, Tensor2D } from "@tensorflow/tfjs";

class ControllerDataset {
    private readonly numClasses: number;
    xs: Tensor4D | null;
    private ys: Tensor2D | null;
    constructor(numClasses: number) {
        this.numClasses = numClasses;
        this.xs = null;
        this.ys = null;
    }

    addTrainData(data: Tensor4D, label: number) {
        if (label < 0 || this.numClasses <= label) throw Error("labelが不正です");

        // One-hot encode the label.
        const y = tf.tidy(() => tf.oneHot(tf.tensor1d([label]).toInt(), this.numClasses)) as Tensor2D;

        if (!this.xs || !this.ys) {
            // For the first example that gets added, keep example and y so that the
            // ControllerDataset owns the memory of the inputs. This makes sure that
            // if addExample() is called in a tf.tidy(), these Tensors will not get
            // disposed.

            this.xs = tf.keep(data);

            this.ys = tf.keep(y);
        } else {
            const oldX = this.xs;
            this.xs = tf.keep(oldX.concat(data, 0));

            const oldY = this.ys;
            this.ys = tf.keep(oldY.concat(y, 0));

            oldX.dispose();
            oldY.dispose();
            y.dispose();
        }
    }

    get classSizes() {
        if (!this.ys) return new Array(this.numClasses).fill(0);
        const ysData = this.ys.arraySync() as number[][];
        const sizes = new Array(this.numClasses).fill(0);
        ysData.forEach((y) => {
            sizes[y.indexOf(1)]++;
        });
        return sizes;
    }

    get dataSize() {
        if (!this.xs) return 0;
        return this.xs.shape[0];
    }
}

export default ControllerDataset;
