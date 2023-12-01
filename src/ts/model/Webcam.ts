import * as tf from "@tensorflow/tfjs";
import type { Tensor4D } from "@tensorflow/tfjs";
import * as tfd from "@tensorflow/tfjs-data";
import type { WebcamIterator } from "@tensorflow/tfjs-data/dist/iterators/webcam_iterator";

class Webcam {
    #webcam: Promise<WebcamIterator>;
    constructor() {
        const monitor = document.querySelector<HTMLVideoElement>("#monitor");
        if (!monitor) throw Error("#webcamが存在しません");
        this.#webcam = tfd.webcam(monitor, { resizeWidth: monitor.width, resizeHeight: monitor.height });
    }

    async getImage() {
        const image = await (await this.#webcam).capture();
        return image;
    }

    async getProcessedImage() {
        const image = await this.getImage();
        const processedImage = tf.tidy<Tensor4D>(() => image.expandDims(0).toFloat().div(255));
        image.dispose();
        return processedImage;
    }
}

export default Webcam;
