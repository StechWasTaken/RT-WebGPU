import Serializable from "../interfaces/serializable";
import Ray from "./ray";

export default class Sphere implements Serializable {
    center: Ray;
    materialIndex: number;
    r: number;

    constructor(center: Ray, r: number, materialIndex: number) {
        this.center = center;
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