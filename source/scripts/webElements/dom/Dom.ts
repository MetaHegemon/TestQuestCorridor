/**
 * Модуль для работы с DOM и html-элементами
 */
import './dom.css';

class Dom {
    private container: HTMLDivElement = this.createContainer();
    public readonly canvas: HTMLCanvasElement = Dom.createCanvas();
    constructor() {}

    init(): void {
        this.createWindow();
        this.setEvents();
    }

    private createContainer(): HTMLDivElement {
        const body = document.getElementsByTagName('body')[0];

        const containerElement = document.createElement('div');
        containerElement.classList.add('container');

        body.appendChild(containerElement);

        return containerElement;
    }

    private static createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.setAttribute('tabindex', '0');
        return canvas;
    }

    /**
     * Создание контейнера для рендера threejs
     */
    private createWindow(): void {
        this.container.append(this.canvas);
    }

    private setEvents(): void {
        this.canvas.addEventListener('contextmenu', (e) => Dom.onContextMenu(e));
    }

    /**
     * Обработчик контекстного меню. Отключает действие по умолчанию
     * @param e {Event}
     */
    private static onContextMenu(e: MouseEvent): void {
        e.preventDefault();
    }

    getContainer(): HTMLDivElement {
        return this.container;
    }

    getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    setCursor(style: string): void {
        if (this.canvas.style.cursor !== style) this.canvas.style.cursor = style;
    }

    resetCursor(): void {
        this.canvas.style.cursor = 'default';
    }
}

export default new Dom();
