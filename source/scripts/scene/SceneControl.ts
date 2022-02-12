import { Color, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default class {
    private container: HTMLDivElement;
    private canvas: HTMLCanvasElement;

    private renderer: WebGLRenderer;

    private camera: PerspectiveCamera = new PerspectiveCamera();
    private scene: Scene = new Scene();

    private orbitControls: OrbitControls;

    private resizeTimer: number;

    constructor() {}

    /**
     * Первоначальная настройка сцены
     */
    init(canvas: HTMLCanvasElement, container: HTMLDivElement): void {
        this.container = container;
        this.canvas = canvas;

        this.renderer = new WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.autoClear = true;

        this.camera.fov = 75;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.near = 1;
        this.camera.far = 1000;
        this.camera.position.set(0, 0, 250);

        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

        this.orbitControls.update();

        this.scene.background = new Color(0xffffff);

        //Отслеживание изменения размера окна
        new ResizeObserver(() => {
            const _this = this;
            clearTimeout(this.resizeTimer);
            this.resizeTimer = window.setTimeout(() => {
                _this.renderResize();
            }, 100);
        }).observe(<Element>this.canvas.parentNode);
    }

    /**
     * Перерасчёт настроек рендера и камеры, при изменении размера окна
     */
    private renderResize(): void {
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;

        const aspect = this.canvas.width / this.canvas.height;
        this.renderer.setSize(this.canvas.width, this.canvas.height);
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }

    /**
     * Запуск рендера сцены
     */
    startRender(): void {
        this.render();
    }

    private render(): void {
        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(() => {
            this.render();
        });
    }

    addObjectsToScene(objects: Object3D[]): void {
        objects.map((o) => this.addObjectToScene(o));
    }

    addObjectToScene(object: Object3D): void {
        this.scene.add(object);
    }

    getCamera(): PerspectiveCamera {
        return this.camera;
    }

    getScene(): Scene {
        return this.scene;
    }

    getRenderer(): WebGLRenderer {
        return this.renderer;
    }
}
