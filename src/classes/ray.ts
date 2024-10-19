import Serializable from "../interfaces/serializable";
import Vector3 from "./vector3";

export default class Ray implements Serializable {
    origin: Vector3;
    time: number;
    direction: Vector3;

    constructor(origin: Vector3, direction: Vector3, time: number) {
        this.origin = origin;
        this.direction = direction;
        this.time = time;
    }

    /**
     * align(16) size(32)
     * @returns {Float32Array}
     */
    encode(): Float32Array {
        const buffer = new Float32Array(8);

        buffer.set(this.origin.encode(), 0);
        buffer[3] = this.time;
        buffer.set(this.direction.encode(), 4);

        return buffer;
    }
}