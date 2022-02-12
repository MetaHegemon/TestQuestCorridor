import './miscellaneous/Clog';
import Dom from './webElements/dom/Dom';
import InfoBlock from './webElements/infoBlock/InfoBlock';
import SceneControl from './scene/SceneControl';
import Builder from './builder/Builder';

class Application {
    private sceneControl: SceneControl = new SceneControl();
    private builder: Builder = new Builder();
    private infoBlock: InfoBlock = new InfoBlock();

    private dotsCount: number = 10;

    constructor() {}

    run(): void {
        Dom.init();

        this.sceneControl.init(Dom.getCanvas(), Dom.getContainer());

        this.infoBlock.init();
        this.infoBlock.setHandlerOnStart(() => this.play());

        this.builder.init(this.sceneControl.getScene(), this.sceneControl.getCamera(), this.infoBlock);
        this.sceneControl.startRender();
    }

    private play(): void {
        this.infoBlock.hideButton();
        this.infoBlock.showTextProgressElement();

        this.builder.clearScene();

        this.createDots();
    }

    private createDots(): void {
        this.builder.createDots(this.dotsCount).then(() => this.changeFirstDot());
    }

    private changeFirstDot(): void {
        this.builder.changeFirstDot().then(() => this.makeCurve());
    }

    private makeCurve(): void {
        this.builder.makeCurve().then(() => this.buildFirstCorridor());
    }

    private buildFirstCorridor(): void {
        this.builder.buildFirstCorridor().then(() => this.calcFrenetFrames());
    }

    private calcFrenetFrames(): void {
        this.builder.calcFrenetFrames().then(() => this.calcRotationMinimizingFrames());
    }

    private calcRotationMinimizingFrames(): void {
        this.builder.calcRotationMinimizingFrames().then(() => this.buildFourCorridor());
    }

    private buildFourCorridor(): void {
        this.builder.buildCorridorByRMF().then(() => this.finish());
    }

    private finish(): void {
        this.infoBlock.showButton();
        this.infoBlock.hideTextProgressElement();
    }
}

const app = new Application();
app.run();
