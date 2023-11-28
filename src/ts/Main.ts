import Breakout from "./breakout/Breakout";
import ModelController from "./model/ModelController";
import Ui from "./model/Ui";

class Main {
    private readonly modelController: ModelController;
    private readonly ui: Ui;

    constructor() {
        const breakout = new Breakout();
        this.modelController = new ModelController();
        this.ui = new Ui(this.modelController, breakout);
    }

    async init() {
        await this.modelController.init();
    }
}

(() => {
    const main = new Main();
    document.addEventListener("DOMContentLoaded", async () => {
        const init = async () => {
            await main.init();
            console.log("初期化完了");
        };

        const showLoading = () => {
            document.getElementById("loading-overlay")!.style.display = "flex";
        };

        const hideLoading = () => {
            document.getElementById("loading-overlay")!.style.display = "none";
        };

        showLoading();
        console.log("ローディング中");
        await init();
        hideLoading();
        console.log("ローディング完了");
    });
})();
