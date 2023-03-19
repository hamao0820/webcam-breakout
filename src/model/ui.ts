import ControllerDataset from "./controller_dataset";
import Webcam from "./webcam";
import * as tf from "@tensorflow/tfjs";
import type { Tensor3D, Tensor4D } from "@tensorflow/tfjs";
import type { LayersModel } from "@tensorflow/tfjs-layers/dist/engine/training";

class Ui {
    private readonly learningRateElement: HTMLSelectElement;
    private readonly batchSizeFractionElement: HTMLSelectElement;
    private readonly epochsElement: HTMLSelectElement;
    private readonly denseUnitsElement: HTMLSelectElement;
    private readonly trainStatusElement: HTMLSpanElement;
    private readonly controllerButtonLeft: HTMLButtonElement;
    private readonly controllerButtonRight: HTMLButtonElement;
    private readonly thumbCanvasLeft: HTMLCanvasElement;
    private readonly thumbCanvasRight: HTMLCanvasElement;
    private readonly contextLeft: CanvasRenderingContext2D;
    private readonly contextRight: CanvasRenderingContext2D;
    private readonly dataSizeLeft: HTMLSpanElement;
    private readonly dataSizeRight: HTMLSpanElement;
    private readonly trainButton: HTMLButtonElement;

    private readonly canvasWidth: number;
    private readonly canvasHeight: number;
    private readonly webcam: Webcam;
    private mouseDown: boolean;

    constructor(webcam: Webcam) {
        this.learningRateElement = document.getElementById("learning-rate") as HTMLSelectElement;
        this.batchSizeFractionElement = document.getElementById("batch-size-fraction") as HTMLSelectElement;
        this.epochsElement = document.getElementById("epochs") as HTMLSelectElement;
        this.denseUnitsElement = document.getElementById("dense-units") as HTMLSelectElement;
        this.trainStatusElement = document.getElementById("train-status") as HTMLSpanElement;
        this.controllerButtonLeft = document.getElementById("button-left") as HTMLButtonElement;
        this.controllerButtonRight = document.getElementById("button-right") as HTMLButtonElement;
        this.thumbCanvasLeft = document.getElementById("thumb-left") as HTMLCanvasElement;
        this.thumbCanvasRight = document.getElementById("thumb-right") as HTMLCanvasElement;
        this.dataSizeLeft = document.getElementById("left-size") as HTMLSpanElement;
        this.dataSizeRight = document.getElementById("right-size") as HTMLSpanElement;
        this.trainButton = document.getElementById("train-button") as HTMLButtonElement;
        const elements = {
            learningRateElement: this.learningRateElement,
            batchSizeFractionElement: this.batchSizeFractionElement,
            epochsElement: this.epochsElement,
            denseUnitsElement: this.denseUnitsElement,
            trainStatusElement: this.trainStatusElement,
            controllerButtonLeft: this.controllerButtonLeft,
            controllerButtonRight: this.controllerButtonRight,
            thumbCanvasLeft: this.thumbCanvasLeft,
            thumbCanvasRight: this.thumbCanvasRight,
            dataSizeLeft: this.dataSizeLeft,
            dataSizeRight: this.dataSizeRight,
            trainButton: this.trainButton,
        };
        const nullKey = (Object.keys(elements) as (keyof typeof elements)[]).find((key) => !elements[key]);
        if (nullKey) throw Error(`${nullKey}が存在しません`);

        this.contextLeft = this.thumbCanvasLeft.getContext("2d") as CanvasRenderingContext2D;
        this.contextRight = this.thumbCanvasRight.getContext("2d") as CanvasRenderingContext2D;
        if (!this.contextLeft || !this.contextRight) throw Error("コンテキストが存在しません");

        this.canvasWidth = this.thumbCanvasLeft.width;
        this.canvasHeight = this.thumbCanvasLeft.height;
        this.webcam = webcam;
        this.mouseDown = false;
    }

    getLeaningRate() {
        return +this.learningRateElement.value;
    }

    getBatchSizeFraction() {
        return +this.batchSizeFractionElement.value;
    }

    getEpochs() {
        return +this.epochsElement.value;
    }

    getDenseUnits() {
        return +this.denseUnitsElement.value;
    }

    private async buttonHandler(
        canvas: HTMLCanvasElement,
        controllerDataset: ControllerDataset,
        preTrained: LayersModel,
        label: number
    ) {
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
            controllerDataset.addTrainData(preTrained.predict(processedImage) as Tensor4D, label);
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

    setTrainStatus(status: string) {
        this.trainStatusElement.innerHTML = status;
    }

    init(train: (units: number) => void, controllerDataset: ControllerDataset, preTrained: LayersModel) {
        this.trainButton.addEventListener("click", () => {
            train(this.getDenseUnits());
        });
        const buttonHandlerLeft = async () => {
            const label = 0;
            await this.buttonHandler(this.thumbCanvasLeft, controllerDataset, preTrained, label);
        };
        const buttonHandlerRight = async () => {
            const label = 1;
            await this.buttonHandler(this.thumbCanvasRight, controllerDataset, preTrained, label);
        };

        const mouseUpHandler = () => {
            this.mouseDown = false;
        };

        this.controllerButtonLeft.addEventListener("mousedown", buttonHandlerLeft);
        this.controllerButtonRight.addEventListener("mousedown", buttonHandlerRight);
        this.controllerButtonLeft.addEventListener("mouseup", mouseUpHandler);
        this.controllerButtonRight.addEventListener("mouseup", mouseUpHandler);
    }
}

export default Ui;
