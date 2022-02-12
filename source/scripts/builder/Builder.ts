import {
    BufferAttribute,
    BufferGeometry,
    CatmullRomCurve3,
    DoubleSide,
    ExtrudeGeometry,
    Group,
    Line,
    LineBasicMaterial,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    Scene,
    Shape,
    SphereBufferGeometry,
    Vector3,
} from 'three';
import InfoBlock from '../webElements/infoBlock/InfoBlock';
import { RMF, RMFrameType } from './RMF';

type DotMeshType = Mesh<SphereBufferGeometry, MeshBasicMaterial>;

export default class {
    private scene: Scene;
    private camera: PerspectiveCamera;
    private infoBlock: InfoBlock;

    //prettier-ignore
    private colors: number[][] = [
        [215, 38, 49],
        [162, 213, 198],
        [7, 123, 138],
        [92, 60, 146]
    ];

    private corridorWidth: number = 6;
    private corridorHeight: number = 2.5;
    private workAreaLimits: Vector3 = new Vector3(200, 200, 200);

    private samplesCount: number = 300;

    private dotMesh: DotMeshType = this.createDotMesh();
    private dots: DotMeshType[] = [];

    private firstDot: DotMeshType;

    private lineMesh: Line;

    private curve: CatmullRomCurve3;
    private dotPositions: Vector3[] = [];
    private curvePoints: Vector3[] = [];

    private axis: Group[] = [];

    private rectMesh: Mesh = new Mesh(new BufferGeometry(), new MeshBasicMaterial());

    private rmFrames: RMFrameType[] = [];

    private debugTimeReduce: number = 1;

    constructor() {}

    private createDotMesh(): DotMeshType {
        const mesh = new Mesh(new SphereBufferGeometry(1), new MeshBasicMaterial({ color: 0x2a2a2a }));
        mesh.name = 'dot';

        return mesh;
    }

    init(scene: Scene, camera: PerspectiveCamera, infoBlock: InfoBlock): void {
        this.scene = scene;
        this.camera = camera;
        this.infoBlock = infoBlock;

        this.colors = this.colors.map((colors) => {
            return colors.map((c) => {
                return c / 255;
            });
        });
    }

    async createDots(dotsCount: number): Promise<void> {
        this.infoBlock.setTextProgressElementText('Создаём ' + dotsCount + ' точек в пространстве в случайных местах');

        for (let i = 0; i < dotsCount; i += 1) {
            const mesh = this.dotMesh.clone();
            mesh.position.set(
                (Math.random() - 0.5) * this.workAreaLimits.x,
                (Math.random() - 0.5) * this.workAreaLimits.y,
                (Math.random() - 0.5) * this.workAreaLimits.z
            );
            mesh.userData.index = i;
            this.dots.push(mesh);
            this.scene.add(mesh);
            await this.wait(500 / this.debugTimeReduce);
        }

        return new Promise((resolve) => {
            resolve();
        });
    }

    async changeFirstDot(): Promise<void> {
        this.infoBlock.setTextProgressElementText('Случайным образом выбираем первую точку');

        const index = Math.round(Math.random() * (this.dots.length - 1));
        this.firstDot = this.dots[index];

        this.firstDot.material = this.firstDot.material.clone();
        this.firstDot.material.color.set('red');

        await this.wait(2000 / this.debugTimeReduce);

        return new Promise((resolve) => {
            resolve();
        });
    }

    async makeCurve(): Promise<void> {
        this.infoBlock.setTextProgressElementText(
            'Строим кривую от текущей точки до ближайшей, от неё до следующей ближайшей т.д.'
        );

        const dots: DotMeshType[] = [];
        this.dots.map((d) => {
            if (d !== this.firstDot) dots.push(d);
        });
        const dotsByPath = [this.firstDot];

        //make list from nearest to nearest
        for (let i = 0; i < dotsByPath.length; i += 1) {
            const currentDot = dotsByPath[i];
            let nearest;
            let dist = Infinity;
            for (let j = 0; j < dots.length; j += 1) {
                const currentDist = dots[j].position.distanceTo(currentDot.position);
                if (currentDist < dist) {
                    nearest = dots[j];
                    dist = currentDist;
                }
            }
            if (nearest) {
                dotsByPath.push(nearest);
                for (let j = 0; j < dots.length; j += 1) {
                    if (dots[j] === nearest) {
                        dots.splice(j, 1);
                        break;
                    }
                }
            }
        }
        this.dots = dotsByPath;

        //build lines from dot to dot
        this.dotPositions = [];

        this.dots.map((d) => this.dotPositions.push(d.position.clone()));

        this.curve = new CatmullRomCurve3(this.dotPositions);

        this.curvePoints = this.curve.getPoints(300);
        const geometry = new BufferGeometry().setFromPoints(this.curvePoints);
        const material = new LineBasicMaterial({ color: 0xff0000 });
        this.lineMesh = new Line(geometry, material);

        this.scene.add(this.lineMesh);

        await this.wait(5000 / this.debugTimeReduce);

        return new Promise((resolve) => {
            resolve();
        });
    }

    async buildFirstCorridor(): Promise<void> {
        this.infoBlock.setTextProgressElementText(
            'Выдавливаем форму прямоугольника 6x2.5 вдоль кривой с помощью ExtrudeGeometry'
        );

        const shape = new Shape();
        shape.moveTo(-3, -1.25);
        shape.lineTo(-3, 1.25);
        shape.lineTo(3, 1.25);
        shape.lineTo(3, -1.25);
        shape.lineTo(-3, -1.25);

        const extrudeSettings = {
            steps: 300,
            depth: 16,
            bevelEnabled: false,
            bevelThickness: 1,
            bevelSize: 1,
            bevelOffset: 0,
            bevelSegments: 1,
            curveSegments: 300,
            extrudePath: this.curve,
        };

        const geometry = new ExtrudeGeometry(shape, extrudeSettings);
        const material = new MeshBasicMaterial({ color: 0x0000ff, wireframe: true });
        this.rectMesh = new Mesh(geometry, material);
        this.scene.add(this.rectMesh);

        await this.wait(5000 / this.debugTimeReduce);

        return new Promise((resolve) => {
            resolve();
        });
    }

    async calcFrenetFrames(): Promise<void> {
        this.infoBlock.setTextProgressElementText('Наверное это не совсем то, что от меня ожидалось');
        await this.wait(5000 / this.debugTimeReduce);

        //remove rect, dots and line
        this.rectMesh.removeFromParent();
        this.dots.map((d) => d.removeFromParent());
        this.lineMesh.removeFromParent();

        this.infoBlock.setTextProgressElementText(
            'Попробуем извлечь фреймы Френета из кривой и посмотреть на тангент, нормаль и бинормаль'
        );
        await this.wait(5000 / this.debugTimeReduce);

        const frames = this.curve.computeFrenetFrames(this.samplesCount);

        this.axis = [];
        for (let i = 0; i < this.samplesCount; i += 1) {
            const group = new Group();
            let p1 = new Vector3();

            let p2 = frames.tangents[i].clone();
            const tangent = this.createLine(p1, p2, 'blue');
            group.add(tangent);

            p2 = frames.normals[i].clone();
            const normal = this.createLine(p1, p2, 'red');
            group.add(normal);

            p2 = frames.binormals[i].clone();
            const binormal = this.createLine(p1, p2, 'green');
            group.add(binormal);

            group.position.copy(this.curvePoints[i]);
            this.axis.push(group);
            this.scene.add(group);

            await this.wait(10 / this.debugTimeReduce);
        }

        this.infoBlock.setTextProgressElementText('Этот метод не подходит, т.к. фрейм часто "перекручивается"');
        await this.wait(5000 / this.debugTimeReduce);

        for (let i = 0; i < this.axis.length; i += 1) {
            this.axis[i].removeFromParent();
            await this.wait(10 / this.debugTimeReduce);
        }
        this.axis = [];

        return new Promise((resolve) => {
            resolve();
        });
    }

    async calcRotationMinimizingFrames(): Promise<void> {
        this.infoBlock.setTextProgressElementText('Посмотрим на метод минимизации вращения фрейма');
        await this.wait(4000 / this.debugTimeReduce);

        const rmf = new RMF(this.curvePoints);

        const frames = rmf.getFrames();
        this.rmFrames = frames;

        this.axis = [];
        for (let i = 0; i < frames.length; i += 1) {
            const group = new Group();
            let p1 = new Vector3();

            let p2 = frames[i].t.clone();
            const tangent = this.createLine(p1, p2, 'blue');
            group.add(tangent);

            p2 = frames[i].r.clone();
            const normal = this.createLine(p1, p2, 'red');
            group.add(normal);

            p2 = frames[i].s.clone();
            const binormal = this.createLine(p1, p2, 'green');
            group.add(binormal);

            group.position.copy(this.curvePoints[i]);
            this.axis.push(group);
            this.scene.add(group);

            await this.wait(10 / this.debugTimeReduce);
        }

        this.infoBlock.setTextProgressElementText('Выглядит идеально, нормали не перекручиваются');
        await this.wait(8000 / this.debugTimeReduce);

        return new Promise((resolve) => {
            resolve();
        });
    }

    async buildCorridorByRMF(): Promise<void> {
        this.infoBlock.setTextProgressElementText('Построим коридор');
        await this.wait(2000 / this.debugTimeReduce);

        this.rectMesh.material = new MeshBasicMaterial({ side: DoubleSide, vertexColors: true });
        this.scene.add(this.rectMesh);

        this.rectMesh.geometry = new BufferGeometry();
        //position
        const positionArray = new Float32Array(24 * 3 * (this.curvePoints.length - 1));
        const position = new BufferAttribute(positionArray, 3, false);
        this.rectMesh.geometry.setAttribute('position', position);

        //color
        const colorArray = new Float32Array(24 * 3 * (this.curvePoints.length - 1));
        const color = new BufferAttribute(colorArray, 3, false);
        this.rectMesh.geometry.setAttribute('color', color);

        for (let i = 0; i < this.curvePoints.length - 1; i += 1) {
            this.drawSector(i, i + 1, positionArray, colorArray);

            this.rectMesh.geometry.attributes.position.needsUpdate = true;
            this.rectMesh.geometry.attributes.color.needsUpdate = true;

            await this.wait(30 / this.debugTimeReduce);
        }

        this.infoBlock.setTextProgressElementText('Всё');
        await this.wait(4000 / this.debugTimeReduce);

        return new Promise((resolve) => {
            resolve();
        });
    }

    private drawSector(i: number, j: number, positionArray: Float32Array, colorArray: Float32Array): void {
        const c = this.getFramePoints(i);
        const n = this.getFramePoints(j);

        // prettier-ignore
        const pos = [
            //top
            c[0].x, c[0].y, c[0].z,
            n[0].x, n[0].y, n[0].z,
            n[1].x, n[1].y, n[1].z,

            c[0].x, c[0].y, c[0].z,
            n[1].x, n[1].y, n[1].z,
            c[1].x, c[1].y, c[1].z,

            //bottom
            c[3].x, c[3].y, c[3].z,
            n[3].x, n[3].y, n[3].z,
            n[2].x, n[2].y, n[2].z,

            c[3].x, c[3].y, c[3].z,
            n[2].x, n[2].y, n[2].z,
            c[2].x, c[2].y, c[2].z,

            //right
            c[1].x, c[1].y, c[1].z,
            n[1].x, n[1].y, n[1].z,
            n[2].x, n[2].y, n[2].z,

            c[1].x, c[1].y, c[1].z,
            n[2].x, n[2].y, n[2].z,
            c[2].x, c[2].y, c[2].z,

            //left
            c[3].x, c[3].y, c[3].z,
            n[3].x, n[3].y, n[3].z,
            n[0].x, n[0].y, n[0].z,

            c[3].x, c[3].y, c[3].z,
            n[0].x, n[0].y, n[0].z,
            c[0].x, c[0].y, c[0].z
        ];

        // prettier-ignore
        const color = [
            //top
            ...this.colors[1],
            ...this.colors[1],
            ...this.colors[1],

            ...this.colors[1],
            ...this.colors[1],
            ...this.colors[1],

            //bottom
            ...this.colors[2],
            ...this.colors[2],
            ...this.colors[2],

            ...this.colors[2],
            ...this.colors[2],
            ...this.colors[2],

            //right
            ...this.colors[3],
            ...this.colors[3],
            ...this.colors[3],

            ...this.colors[3],
            ...this.colors[3],
            ...this.colors[3],

            //left
            ...this.colors[0],
            ...this.colors[0],
            ...this.colors[0],

            ...this.colors[0],
            ...this.colors[0],
            ...this.colors[0],
        ];

        for (let k = 0; k < pos.length; k += 1) {
            positionArray[i * pos.length + k] = pos[k];
        }

        for (let k = 0; k < color.length; k += 1) {
            colorArray[i * color.length + k] = color[k];
        }
    }

    private getFramePoints(index: number): Vector3[] {
        const normal = this.rmFrames[index].r;
        const up = this.rmFrames[index].s;

        const framePoints = [];
        framePoints.push(
            normal
                .clone()
                .normalize()
                .multiplyScalar(this.corridorWidth / 2)
                .add(
                    up
                        .clone()
                        .normalize()
                        .multiplyScalar(this.corridorHeight / 2)
                )
                .add(this.curvePoints[index])
        );
        framePoints.push(
            normal
                .clone()
                .normalize()
                .multiplyScalar(-this.corridorWidth / 2)
                .add(
                    up
                        .clone()
                        .normalize()
                        .multiplyScalar(this.corridorHeight / 2)
                )
                .add(this.curvePoints[index])
        );
        framePoints.push(
            normal
                .clone()
                .normalize()
                .multiplyScalar(-this.corridorWidth / 2)
                .add(
                    up
                        .clone()
                        .normalize()
                        .multiplyScalar(-this.corridorHeight / 2)
                )
                .add(this.curvePoints[index])
        );
        framePoints.push(
            normal
                .clone()
                .normalize()
                .multiplyScalar(this.corridorWidth / 2)
                .add(
                    up
                        .clone()
                        .normalize()
                        .multiplyScalar(-this.corridorHeight / 2)
                )
                .add(this.curvePoints[index])
        );

        return framePoints;
    }

    private createLine(p1: Vector3, p2: Vector3, color: string): Line {
        const geometry = new BufferGeometry().setFromPoints([p1, p2]);
        return new Line(geometry, new MeshBasicMaterial({ color: color }));
    }

    private wait(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    clearScene(): void {
        this.dots.map((d) => d.removeFromParent());
        this.dots = [];
        if (this.lineMesh) this.lineMesh.removeFromParent();
        if (this.rectMesh) this.rectMesh.removeFromParent();
        this.axis.map((a) => {
            a.removeFromParent();
        });
        this.axis = [];
    }
}
