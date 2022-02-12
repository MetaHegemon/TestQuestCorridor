import './infoBlock.css';

export default class {
    private startButton: HTMLDivElement = this.createStartButton();
    private textProgressElement: HTMLDivElement = this.createTextProgressElement();

    private infoBlock: HTMLDivElement = this.createInfoBlock();

    private container: HTMLBodyElement = document.getElementsByTagName('body')[0];

    constructor() {}

    private createInfoBlock(): HTMLDivElement {
        const infoBlock = document.createElement('div');
        infoBlock.classList.add('info-block');

        return infoBlock;
    }

    private createStartButton(): HTMLDivElement {
        const button = document.createElement('div');
        button.classList.add('start-button');
        button.textContent = 'PLAY';

        return button;
    }

    private createTextProgressElement(): HTMLDivElement {
        const textProgressElement = document.createElement('div');
        textProgressElement.classList.add('text-progress');
        textProgressElement.style.display = 'none';

        return textProgressElement;
    }

    init(): void {
        this.infoBlock.innerHTML = '';
        this.infoBlock.appendChild(this.startButton);
        this.infoBlock.appendChild(this.textProgressElement);

        this.container.appendChild(this.infoBlock);
    }

    showButton(): void {
        this.startButton.style.display = 'block';
    }

    hideButton(): void {
        this.startButton.style.display = 'none';
    }

    showTextProgressElement(): void {
        this.textProgressElement.style.display = 'block';
    }

    hideTextProgressElement(): void {
        this.textProgressElement.style.display = 'none';
    }

    setTextProgressElementText(text: string): void {
        this.textProgressElement.textContent = text;
    }

    setHandlerOnStart(handler: () => void): void {
        this.startButton.onclick = handler;
    }

    getTextProgressElement(): HTMLDivElement {
        return this.textProgressElement;
    }
}
