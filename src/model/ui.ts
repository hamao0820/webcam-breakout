import ControllerDataset from "./controller_dataset";
import Webcam from "./webcam";
import * as tf from "@tensorflow/tfjs";
import type { Tensor3D } from "@tensorflow/tfjs";

class Ui {
    private readonly learningRateElement: HTMLSelectElement;
    private readonly batchSizeFractionElement: HTMLSelectElement;
    private readonly epochsElement: HTMLSelectElement;
    private readonly denseUnitsElement: HTMLSelectElement;
    private readonly trainStatusElement: HTMLSpanElement;
    private readonly controllerButtonLeft: HTMLButtonElement;
    private readonly controllerButtonRight: HTMLButtonElement;
    private readonly dataSizeLeft: HTMLSpanElement;
    private readonly dataSizeRight: HTMLSpanElement;

    private readonly canvasWidth: number;
    private readonly canvasHeight: number;
    private readonly webcam: Webcam;
    private mouseDown: boolean;

    constructor(webcam: Webcam, controllerDataset: ControllerDataset) {
        this.learningRateElement = document.getElementById("learning-rate") as HTMLSelectElement;
        this.batchSizeFractionElement = document.getElementById("bach-size-fraction") as HTMLSelectElement;
        this.epochsElement = document.getElementById("epochs") as HTMLSelectElement;
        this.denseUnitsElement = document.getElementById("dense-units") as HTMLSelectElement;
        this.trainStatusElement = document.getElementById("train-status") as HTMLSpanElement;
        this.controllerButtonLeft = document.getElementById("button-left") as HTMLButtonElement;
        this.controllerButtonRight = document.getElementById("button-right") as HTMLButtonElement;

        const thumbCanvasLeft = document.getElementById("thumb-left") as HTMLCanvasElement;
        const thumbCanvasRight = document.getElementById("thumb-right") as HTMLCanvasElement;
        const contextLeft = thumbCanvasLeft.getContext("2d") as CanvasRenderingContext2D;
        const contextRight = thumbCanvasRight.getContext("2d") as CanvasRenderingContext2D;
        this.dataSizeLeft = document.getElementById("left-size") as HTMLSpanElement;
        this.dataSizeRight = document.getElementById("right-size") as HTMLSpanElement;
        if (
            [
                this.learningRateElement,
                this.batchSizeFractionElement,
                this.epochsElement,
                this.denseUnitsElement,
                this.trainStatusElement,
                this.controllerButtonLeft,
                this.controllerButtonRight,
                thumbCanvasLeft,
                thumbCanvasRight,
                contextLeft,
                contextRight,
                this.dataSizeLeft,
                this.dataSizeRight,
            ].every((v) => v)
        )
            throw Error("要素がありません");

        this.canvasWidth = thumbCanvasLeft.width;
        this.canvasHeight = thumbCanvasLeft.height;
        this.webcam = webcam;
        this.mouseDown = false;

        const buttonHandlerLeft = async () => {
            const label = 0;
            await this.buttonHandler(thumbCanvasLeft, controllerDataset, label);
        };
        const buttonHandlerRight = async () => {
            const label = 1;
            await this.buttonHandler(thumbCanvasRight, controllerDataset, label);
        };

        const mouseUpHandler = () => {
            this.mouseDown = false;
        };

        this.controllerButtonLeft.addEventListener("mousedown", buttonHandlerLeft);
        this.controllerButtonRight.addEventListener("mousedown", buttonHandlerRight);
        this.controllerButtonLeft.addEventListener("mouseup", mouseUpHandler);
        this.controllerButtonRight.addEventListener("mouseup", mouseUpHandler);
    }

    getLeaningRate() {
        return +this.learningRateElement.value;
    }

    getBachSizeFraction() {
        return +this.batchSizeFractionElement.value;
    }

    getEpochs() {
        return +this.epochsElement.value;
    }

    getDenseUnits() {
        return +this.denseUnitsElement.value;
    }

    private async buttonHandler(canvas: HTMLCanvasElement, controllerDataset: ControllerDataset, label: number) {
        this.mouseDown = true;
        const forThumb = async () => {
            const image = await this.webcam.getImage();
            const thumbImage = tf.tidy<Tensor3D>(() =>
                image.reverse(1).resizeBilinear([this.canvasWidth, this.canvasHeight]).div(256)
            );
            this.drawThumb(thumbImage, canvas);
            image.dispose();
            thumbImage.dispose();
        };
        const forDataset = async () => {
            const processedImage = await this.webcam.getProcessedImage();
            controllerDataset.addTrainData(processedImage, label);
        };
        while (this.mouseDown) {
            await new Promise<void>((resolve) => setTimeout(resolve, 50));
            await Promise.all([forThumb(), forDataset()]);
            this.dataSizeLeft.innerHTML = String(controllerDataset.classSizes[0]);
            this.dataSizeRight.innerHTML = String(controllerDataset.classSizes[1]);
        }
    }

    private drawThumb(image: Tensor3D, canvas: HTMLCanvasElement) {
        tf.browser.toPixels(image, canvas);
    }
}

export default Ui;
