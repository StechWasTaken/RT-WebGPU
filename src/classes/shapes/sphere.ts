import Hittable from "../../interfaces/hittable";
import Serializable from "../../interfaces/serializable";
import AABB from "../aabb";
import Ray from "../ray";
import Vector3 from "../vector3";

export default class Sphere implements Serializable, Hittable {
    center: Ray;
    r: number;
    materialIndex: number;
    bbox: AABB;

    constructor(center: Vector3, r: number, materialIndex: number) {
        const direction = new Vector3(0,0,0);
        this.center = new Ray(center, direction, 0);
        this.materialIndex = materialIndex;
        this.r = r;

        const rvec = new Vector3(r, r, r);

        this.bbox = new AABB({
            points: {
                a: center.subtract(rvec),
                b: center.add(rvec),
            }
        }); 
    }

    /**
     * align(16) size(48)
     * @returns {Float32Array}
     */
    encode(): Float32Array {
        const buffer = new Float32Array(16);

        buffer.set(this.center.encode(), 0);
        buffer[8] = this.materialIndex;
        buffer[9] = this.r;
        buffer.set(this.bbox.encode(), 10);

        return buffer;
    }
}