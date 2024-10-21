import Serializable from "../interfaces/serializable";
import Material from "./material";
import Ray from "./ray";
import Vector3 from "./vector3";

export default class Sphere implements Serializable {
    center: Ray;
    r: number;
    materialIndex: number;

    constructor(center: Vector3, r: number, materialIndex: number) {
        const direction = new Vector3(0,0,0);
        this.center = new Ray(center, direction, 0);
        this.materialIndex = materialIndex;
        this.r = r;
    }

    /**
     * align(16) size(48)
     * @returns {Float32Array}
     */
    encode(): Float32Array {
        const buffer = new Float32Array(12);

        buffer.set(this.center.encode(), 0);
        buffer[8] = this.materialIndex;
        buffer[9] = this.r;

        return buffer;
    }
}