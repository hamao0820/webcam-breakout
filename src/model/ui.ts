import ControllerDataset from "./controller_dataset";
import Webcam from "./webcam";
import * as tf from "@tensorflow/tfjs";
import type { Tensor3D, Tensor4D } from "@tensorflow/tfjs";

class Ui {
    private readonly trainStatusElement: HTMLSpanElement;
    private readonly thumbCanvasLeft: HTMLCanvasElement;
    private readonly thumbCanvasRight: HTMLCanvasElement;
    private readonly contextLeft: CanvasRenderingContext2D;
    private readonly contextRight: CanvasRenderingContext2D;
    private readonly trainButton: HTMLButtonElement;

    private readonly canvasWidth: number;
    private readonly canvasHeight: number;
    private readonly webcam: Webcam;
    private mouseDown: boolean;

    constructor(webcam: Webcam) {
        this.trainStatusElement = document.getElementById("train-status") as HTMLSpanElement;
        this.thumbCanvasLeft = document.getElementById("thumb-left") as HTMLCanvasElement;
        this.thumbCanvasRight = document.getElementById("thumb-right") as HTMLCanvasElement;
        this.trainButton = document.getElementById("train-button") as HTMLButtonElement;
        const elements = {
            trainStatusElement: this.trainStatusElement,
            thumbCanvasLeft: this.thumbCanvasLeft,
            thumbCanvasRight: this.thumbCanvasRight,
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

    private getElementByIdAndCheckExist<T extends HTMLElement>(id: string) {
        const element = document.getElementById(id) as T;
        if (!element) throw Error(`#${id}が存在しません`);
        return element;
    }

    getLeaningRate() {
        const learningRateElement = this.getElementByIdAndCheckExist<HTMLSelectElement>("learning-rate");
        return +learningRateElement.value;
    }

    getBatchSizeFraction() {
        const batchSizeFractionElement = this.getElementByIdAndCheckExist<HTMLSelectElement>("batch-size-fraction");
        return +batchSizeFractionElement.value;
    }

    getEpochs() {
        const epochsElement = this.getElementByIdAndCheckExist<HTMLSelectElement>("epochs");
        return +epochsElement.value;
    }

    getDenseUnits() {
        const denseUnitsElement = this.getElementByIdAndCheckExist<HTMLSelectElement>("dense-units");
        return +denseUnitsElement.value;
    }

    doneLoading() {
        const statusElement = document.getElementById("loading-status") as HTMLDivElement;
        if (!statusElement) throw Error("div#loading-statusがありません");
        statusElement.remove();
    }

    private async buttonHandler(
        canvas: HTMLCanvasElement,
        controllerDataset: ControllerDataset,
        embedding: (image: Tensor4D) => tf.Tensor<tf.Rank> | tf.Tensor<tf.Rank>[],
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
            controllerDataset.addTrainData(embedding(processedImage) as Tensor4D, label);
        };

        const dataSizeLeft = this.getElementByIdAndCheckExist<HTMLSpanElement>("left-size");
        const dataSizeRight = this.getElementByIdAndCheckExist<HTMLSpanElement>("right-size");
        
        while (this.mouseDown) {
            await new Promise<void>((resolve) => setTimeout(resolve, 50));
            await Promise.all([forThumb(), forDataset()]);
            dataSizeLeft.innerHTML = String(controllerDataset.classSizes[0]);
            dataSizeRight.innerHTML = String(controllerDataset.classSizes[1]);
        }
    }

    private drawThumb(image: Tensor3D, canvas: HTMLCanvasElement) {
        tf.browser.toPixels(image, canvas);
    }

    setTrainStatus(status: string) {
        this.trainStatusElement.innerHTML = status;
    }

    init(
        train: (units: number) => void,
        controllerDataset: ControllerDataset,
        embedding: (image: Tensor4D) => tf.Tensor<tf.Rank> | tf.Tensor<tf.Rank>[],
        predict: () => void
    ) {
        const controllerButtonLeft = document.getElementById("button-left") as HTMLButtonElement;
        const controllerButtonRight = document.getElementById("button-right") as HTMLButtonElement;
        if (!controllerButtonLeft || !controllerButtonRight) throw Error("コントローラーボタンがありません。");

        this.trainButton.addEventListener("click", () => {
            train(this.getDenseUnits());
        });
        const buttonHandlerLeft = async () => {
            const label = 0;
            await this.buttonHandler(this.thumbCanvasLeft, controllerDataset, embedding, label);
        };
        const buttonHandlerRight = async () => {
            const label = 1;
            await this.buttonHandler(this.thumbCanvasRight, controllerDataset, embedding, label);
        };

        const mouseUpHandler = () => {
            this.mouseDown = false;
        };

        const buttonPredict = document.getElementById("predict-button") as HTMLButtonElement;
        if (!buttonPredict) throw Error("要素が存在しません");
        buttonPredict.addEventListener("click", predict);

        controllerButtonLeft.addEventListener("mousedown", buttonHandlerLeft);
        controllerButtonRight.addEventListener("mousedown", buttonHandlerRight);
        controllerButtonLeft.addEventListener("mouseup", mouseUpHandler);
        controllerButtonRight.addEventListener("mouseup", mouseUpHandler);
    }
}

export default Ui;
