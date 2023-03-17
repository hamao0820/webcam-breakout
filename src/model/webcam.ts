import * as tf from "@tensorflow/tfjs";
import * as tfd from "@tensorflow/tfjs-data";
import { WebcamIterator } from "@tensorflow/tfjs-data/dist/iterators/webcam_iterator";

class Webcam {
    #webcam: Promise<WebcamIterator>;
    constructor() {
        const monitor = document.querySelector<HTMLVideoElement>("#monitor");
        if (!monitor) throw Error("#webcamが存在しません");
        this.#webcam = tfd.webcam(monitor);
    }

    private async getImage() {
        const image = await (await this.#webcam).capture();
        return tf.reverse(image);
    }

    async getProcessedImage() {
        const image = await this.getImage();
        const processedImage = tf.tidy(() => image.expandDims(0).toFloat().div(127).sub(1));
        image.dispose();
        return processedImage;
    }
}

export default Webcam;
