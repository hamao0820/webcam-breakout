import Game from "./breakout";
import Model from "./model/model";
import Webcam from "./model/webcam";
import "./scss/style.scss";

new Game();
const webcam = new Webcam();
const main = async () => {
    const model = await Model.build(150);
    console.log(model);
};
main();
