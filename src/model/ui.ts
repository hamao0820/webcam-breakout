import ModelController from "./ModelController";
import Webcam from "./webcam";
import * as tf from "@tensorflow/tfjs";
import type { Tensor3D, Tensor4D } from "@tensorflow/tfjs";
import { EventEmitter } from "events";

class Ui {
    private readonly thumbCanvasLeft: HTMLCanvasElement;
    private readonly thumbCanvasRight: HTMLCanvasElement;
    private readonly modelController: ModelController;

    private readonly webcam: Webcam;
    private mouseDown: boolean;

    constructor(webcam: Webcam, modelController: ModelController) {
        this.thumbCanvasLeft = document.getElementById("thumb-left") as HTMLCanvasElement;
        this.thumbCanvasRight = document.getElementById("thumb-right") as HTMLCanvasElement;
        const elements = {
            thumbCanvasLeft: this.thumbCanvasLeft,
            thumbCanvasRight: this.thumbCanvasRight,
        };
        const nullKey = (Object.keys(elements) as (keyof typeof elements)[]).find((key) => !elements[key]);
        if (nullKey) throw Error(`${nullKey}が存在しません`);

        this.webcam = webcam;
        this.mouseDown = false;

        this.modelController = modelController;
        this.modelController.on("batchEnd", (loss: string) => {
            this.setTrainStatus(`Loss: ${loss}`);
        });
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

    private async buttonHandler(canvas: HTMLCanvasElement, label: number) {
        this.mouseDown = true;
        const forThumb = async () => {
            const image = await this.webcam.getImage();
            const thumbImage = tf.tidy<Tensor3D>(() =>
                image.reverse(1).resizeBilinear([this.thumbCanvasLeft.width, this.thumbCanvasLeft.height]).div(256)
            );
            this.drawThumb(thumbImage, canvas);
            image.dispose();
            thumbImage.dispose();
        };
        const forDataset = async () => {
            const processedImage = await this.webcam.getProcessedImage();
            this.modelController.controllerDataset.addTrainData(
                this.modelController.embedding(processedImage) as Tensor4D,
                label
            );
        };

        const dataSizeLeft = this.getElementByIdAndCheckExist<HTMLSpanElement>("left-size");
        const dataSizeRight = this.getElementByIdAndCheckExist<HTMLSpanElement>("right-size");

        while (this.mouseDown) {
            await new Promise<void>((resolve) => setTimeout(resolve, 50));
            await Promise.all([forThumb(), forDataset()]);
            dataSizeLeft.innerHTML = String(this.modelController.controllerDataset.classSizes[0]);
            dataSizeRight.innerHTML = String(this.modelController.controllerDataset.classSizes[1]);
        }
    }

    private drawThumb(image: Tensor3D, canvas: HTMLCanvasElement) {
        tf.browser.toPixels(image, canvas);
    }

    setTrainStatus(status: string) {
        const trainStatusElement = this.getElementByIdAndCheckExist<HTMLSpanElement>("train-status");
        trainStatusElement.innerHTML = status;
    }

    init(predict: () => void) {
        const controllerButtonLeft = document.getElementById("button-left") as HTMLButtonElement;
        const controllerButtonRight = document.getElementById("button-right") as HTMLButtonElement;
        if (!controllerButtonLeft || !controllerButtonRight) throw Error("コントローラーボタンがありません。");
        const trainButton = this.getElementByIdAndCheckExist<HTMLButtonElement>("train-button");

        trainButton.addEventListener("click", () => {
            this.modelController.train(
                this.getDenseUnits(),
                this.getLeaningRate(),
                this.getBatchSizeFraction(),
                this.getEpochs()
            );
        });
        const buttonHandlerLeft = async () => {
            const label = 0;
            await this.buttonHandler(this.thumbCanvasLeft, label);
        };
        const buttonHandlerRight = async () => {
            const label = 1;
            await this.buttonHandler(this.thumbCanvasRight, label);
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
