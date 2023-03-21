import Breakout from "../breakout/Breakout";
import ModelController from "./ModelController";
import Webcam from "./Webcam";
import * as tf from "@tensorflow/tfjs";
import type { Tensor3D, Tensor4D } from "@tensorflow/tfjs";


class Ui {
    private readonly thumbCanvasLeft: HTMLCanvasElement;
    private readonly thumbCanvasRight: HTMLCanvasElement;
    private readonly buttonTrain: HTMLButtonElement;

    private readonly modelController: ModelController;
    private readonly webcam: Webcam;
    private breakout: Breakout;

    private mouseDown: boolean;

    constructor(modelController: ModelController, breakout: Breakout) {
        this.thumbCanvasLeft = document.getElementById("thumb-left") as HTMLCanvasElement;
        this.thumbCanvasRight = document.getElementById("thumb-right") as HTMLCanvasElement;
        const elements = {
            thumbCanvasLeft: this.thumbCanvasLeft,
            thumbCanvasRight: this.thumbCanvasRight,
        };
        const nullKey = (Object.keys(elements) as (keyof typeof elements)[]).find((key) => !elements[key]);
        if (nullKey) throw Error(`${nullKey}が存在しません`);

        this.webcam = new Webcam();
        this.mouseDown = false;

        const controllerButtonLeft = this.getElementByIdAndCheckExists<HTMLButtonElement>("button-left");
        const controllerButtonRight = this.getElementByIdAndCheckExists<HTMLButtonElement>("button-right");
        this.buttonTrain = this.getElementByIdAndCheckExists<HTMLButtonElement>("train-button");
        const leverIcon = this.getElementByIdAndCheckExists<HTMLDivElement>("lever-image");
        const switchLever = ({ classId }: { classId: number }) => {
            switch (classId) {
                case 0: {
                    leverIcon.style.transform = "none";
                    break;
                }
                case 1: {
                    leverIcon.style.transform = "scaleX(-1)";
                    break;
                }
                default:
                    throw Error("classIdが不正です");
            }
        };

        this.modelController = modelController;
        this.modelController.on("batchEnd", ({ loss }) => {
            this.setTrainStatus(`Loss: ${loss}`);
        });
        this.modelController.on("modelInit", this.doneLoading.bind(this));
        this.modelController.on("trainDone", this.enableStart.bind(this));
        this.modelController.on("predict", this.highlightCorrectAnswer.bind(this));
        const paddleOperate = ({ classId }: { classId: 0 | 1 }) => {
            this.breakout.paddleOperate(classId);
        };
        this.modelController.on("predict", paddleOperate);
        this.modelController.on("predict", switchLever);

        this.buttonTrain.addEventListener("click", () => {
            this.modelController.train(
                this.getDenseUnits(),
                this.getLeaningRate(),
                this.getBatchSizeFraction(),
                this.getEpochs()
            );
        });

        this.breakout = breakout;
        this.breakout.on("step", async () => {
            const image = await this.webcam.getProcessedImage();
            this.modelController.predict(image);
        });
        const buttonStart = this.getElementByIdAndCheckExists<HTMLButtonElement>("start-button");
        const buttonRetry = this.getElementByIdAndCheckExists<HTMLButtonElement>("retry-button");

        const buttonReset = this.getElementByIdAndCheckExists<HTMLButtonElement>("reset-button");
        const thumbContextLeft = this.thumbCanvasLeft.getContext("2d");
        const thumbContextRight = this.thumbCanvasRight.getContext("2d");
        if (!thumbContextLeft || !thumbContextRight) throw Error("コンテキストが存在しません");
        tf.ready().then(() => {
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

            controllerButtonLeft.addEventListener("mousedown", buttonHandlerLeft);
            controllerButtonRight.addEventListener("mousedown", buttonHandlerRight);
            controllerButtonLeft.addEventListener("mouseup", mouseUpHandler);
            controllerButtonRight.addEventListener("mouseup", mouseUpHandler);

            const start = () => {
                this.breakout.start();
            };
            const retry = () => {
                this.breakout.gameOver();
                this.breakout = this.breakout.init();
                this.breakout.on("step", async () => {
                    const image = await this.webcam.getProcessedImage();
                    this.modelController.predict(image);
                });
            };
            buttonStart.addEventListener("click", start);
            buttonStart.addEventListener("click", () => {
                buttonStart.setAttribute("disabled", "true");
                buttonRetry.removeAttribute("disabled");
            });
            buttonRetry.addEventListener("click", retry);
            buttonRetry.addEventListener("click", () => {
                buttonStart.removeAttribute("disabled");
                buttonRetry.setAttribute("disabled", "true");
            });

            const reset = () => {
                const thumbBoxLeft = this.getElementByIdAndCheckExists("thumb-box-left");
                const thumbBoxRight = this.getElementByIdAndCheckExists("thumb-box-right");
                thumbBoxLeft.classList.remove("predicted");
                thumbBoxRight.classList.remove("predicted");
                this.buttonTrain.setAttribute("disabled", "true");
                this.setTrainStatus("学習");
                this.modelController.resetDataset();
                thumbContextLeft.clearRect(0, 0, this.thumbCanvasLeft.width, this.thumbCanvasLeft.height);
                thumbContextRight.clearRect(0, 0, this.thumbCanvasRight.width, this.thumbCanvasRight.height);
            };

            buttonReset.addEventListener("click", reset);
        });

        const dialogProcess = this.getElementByIdAndCheckExists<HTMLDialogElement>("process-dialog");
        const howToPlayBlock = this.getElementByIdAndCheckExists<HTMLDivElement>("how-to-play");
        const buttonClose = this.getElementByIdAndCheckExists<HTMLButtonElement>("close-button");
        howToPlayBlock.addEventListener("click", () => {
            dialogProcess.showModal();
        });
        buttonClose.addEventListener("click", () => {
            dialogProcess.close();
        });
    }

    private getElementByIdAndCheckExists<T extends HTMLElement>(id: string) {
        const element = document.getElementById(id) as T;
        if (!element) throw Error(`#${id}が存在しません`);
        return element;
    }

    private getLeaningRate() {
        const learningRateElement = this.getElementByIdAndCheckExists<HTMLSelectElement>("learning-rate");
        return +learningRateElement.value;
    }

    private getBatchSizeFraction() {
        const batchSizeFractionElement = this.getElementByIdAndCheckExists<HTMLSelectElement>("batch-size-fraction");
        return +batchSizeFractionElement.value;
    }

    private getEpochs() {
        const epochsElement = this.getElementByIdAndCheckExists<HTMLSelectElement>("epochs");
        return +epochsElement.value;
    }

    private getDenseUnits() {
        const denseUnitsElement = this.getElementByIdAndCheckExists<HTMLSelectElement>("dense-units");
        return +denseUnitsElement.value;
    }

    private doneLoading() {
        const statusElement = this.getElementByIdAndCheckExists<HTMLDivElement>("loading-status");
        statusElement.style.setProperty("display", "none");
    }

    private highlightCorrectAnswer({ classId }: { classId: number }) {
        const buttonBoxLeft = this.getElementByIdAndCheckExists("button-box-left");
        const buttonBoxRight = this.getElementByIdAndCheckExists("button-box-right");
        switch (classId) {
            case 0: {
                buttonBoxLeft.classList.add("predicted");
                buttonBoxRight.classList.remove("predicted");
                break;
            }
            case 1: {
                buttonBoxRight.classList.add("predicted");
                buttonBoxLeft.classList.remove("predicted");
                break;
            }
            default:
                throw Error();
        }
    }

    private async buttonHandler(canvas: HTMLCanvasElement, label: number) {
        this.mouseDown = true;
        const buttonReset = this.getElementByIdAndCheckExists<HTMLButtonElement>("reset-button");
        buttonReset.removeAttribute("disabled");
        this.buttonTrain.removeAttribute("disabled");
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
            this.modelController.addTrainData(processedImage, label);
        };

        const dataSizeLeft = this.getElementByIdAndCheckExists<HTMLSpanElement>("left-size");
        const dataSizeRight = this.getElementByIdAndCheckExists<HTMLSpanElement>("right-size");

        while (this.mouseDown) {
            await new Promise<void>((resolve) => setTimeout(resolve, 50));
            await Promise.all([forThumb(), forDataset()]);
            dataSizeLeft.innerHTML = String(this.modelController.getClassSizes(0));
            dataSizeRight.innerHTML = String(this.modelController.getClassSizes(1));
        }
    }

    private drawThumb(image: Tensor3D, canvas: HTMLCanvasElement) {
        tf.browser.toPixels(image, canvas);
    }

    private setTrainStatus(status: string) {
        const trainStatusElement = this.getElementByIdAndCheckExists<HTMLSpanElement>("train-status");
        trainStatusElement.innerHTML = status;
    }

    private enableStart() {
        const buttonStart = this.getElementByIdAndCheckExists<HTMLButtonElement>("start-button");
        buttonStart.removeAttribute("disabled");
    }
}

export default Ui;
