import { Vector3 } from 'three';

export type RMFrameType = { t: Vector3; r: Vector3; s: Vector3 };

export class RMF {
    private points: Vector3[];
    private readonly cutPoints: Vector3[];

    constructor(points: Vector3[]) {
        this.points = RMF.extendCurvePoints(points);
        this.cutPoints = this.points.slice(2, this.points.length - 2);
    }

    private static extendCurvePoints(points: Vector3[]): Vector3[] {
        let dist = points[0].distanceTo(points[1]);
        const pointMinus1 = points[0].clone().sub(points[1]).multiplyScalar(dist).add(points[1]);
        const pointMinus2 = points[0]
            .clone()
            .sub(points[1])
            .multiplyScalar(dist * 2)
            .add(points[1]);

        dist = points[points.length - 1].distanceTo(points[points.length - 2]);
        const pointPlus1 = points[points.length - 1]
            .clone()
            .sub(points[points.length - 2])
            .multiplyScalar(dist)
            .add(points[points.length - 2]);

        const pointPlus2 = points[points.length - 1]
            .clone()
            .sub(points[points.length - 2])
            .multiplyScalar(dist * 2)
            .add(points[points.length - 2]);

        return [pointMinus2, pointMinus1, ...points, pointPlus1, pointPlus2];
    }

    getFrames() {
        const frames: RMFrameType[] = [];

        const { t: t0, n: r0, b: s0 } = this.getFrenetFrame(0);
        frames.push({ t: t0, r: r0, s: s0 });

        for (let i = 0; i < this.cutPoints.length - 1; i++) {
            const j = i + 1;

            const xi = this.cutPoints[i];
            const xj = this.cutPoints[j];

            const { t: ti, r: ri } = frames[frames.length - 1];
            const tj = this.getTangent(j);

            const v1 = xj.clone().sub(xi);
            const c1 = v1.clone().dot(v1);
            const rl = ri.clone().sub(v1.clone().multiplyScalar((2 / c1) * v1.clone().dot(ri)));
            const tl = ti.clone().sub(v1.clone().multiplyScalar((2 / c1) * v1.clone().dot(ti)));

            const v2 = tj.clone().sub(tl);
            const c2 = v2.clone().dot(v2);
            const rj = rl.clone().sub(v2.clone().multiplyScalar((2 / c2) * v2.clone().dot(rl)));
            const sj = tj.clone().cross(rj);

            frames.push({ t: tj, r: rj, s: sj });
        }

        return frames;
    }

    private getFrenetFrame(i: number): { t: Vector3; n: Vector3; b: Vector3 } {
        const tangent = this.getTangent(i);
        const normal = this.getNormal(i).normalize();
        const binormal = tangent.clone().cross(normal);

        return {
            t: tangent,
            n: normal,
            b: binormal,
        };
    }

    private getTangent(i: number): Vector3 {
        return this.points[i + 3]
            .clone()
            .sub(this.points[i + 1])
            .normalize();
    }

    private getNormal(i: number): Vector3 {
        return this.getTangent(i + 1)
            .clone()
            .sub(this.getTangent(i - 1));
    }
}
