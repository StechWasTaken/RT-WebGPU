import AABB from "../aabb";
import Vector3 from "../vector3";
import Geometry from "./geometry";

export default class Quad extends Geometry {
    static readonly ID: number = 2;

    constructor(Q: Vector3, u: Vector3, v: Vector3, materialIndex: number) {
        const bboxDiagonal1 = new AABB({
            points: {
                a: Q,
                b: Q.add(u).add(v),
            }
        });
        const bboxDiagonal2 = new AABB({
            points: {
                a: Q.add(u),
                b: Q.add(v),
            }
        });
        const bbox = new AABB({
            boxes: {
                box0: bboxDiagonal1,
                box1: bboxDiagonal2,
            }
        });
        
        const n = u.cross(v);
        const normal = n.normalize();
        const D = normal.dot(Q);
        const w = n.divide(n.dot(n));

        super({
            Q: Q,
            u: u,
            v: v,
            normal: normal,
            D: D,
            w: w,
            bbox: bbox,
            materialIndex: materialIndex,
            id: Quad.ID,
        });
    }
}