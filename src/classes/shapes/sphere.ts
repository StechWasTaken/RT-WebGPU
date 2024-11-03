import Hittable from "../../interfaces/hittable";
import Serializable from "../../interfaces/serializable";
import AABB from "../aabb";
import Ray from "../ray";
import Vector3 from "../vector3";
import Geometry from "./geometry";

export default class Sphere extends Geometry {
    static readonly ID: number = 1;

    constructor(center: Vector3, r: number, materialIndex: number) {
        const direction = Vector3.ZERO;
        const time = 0;
        const ray = new Ray(center, direction, time);

        const rvec = new Vector3(r, r, r);
        const bbox = new AABB({
            points: {
                a: center.subtract(rvec),
                b: center.add(rvec),
            }
        });

        super({
            center: ray,
            r: r,
            materialIndex: materialIndex,
            bbox: bbox,
            id: Sphere.ID,
        });
    }
}