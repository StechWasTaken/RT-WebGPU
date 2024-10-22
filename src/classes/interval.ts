import Serializable from "../interfaces/serializable";

export default class Interval implements Serializable {
    min: number;
    max: number;

    constructor(
        min: number = Number.POSITIVE_INFINITY,
        max: number = Number.NEGATIVE_INFINITY,
    ) {
        this.min = min;
        this.max = max;
    }

    size(): number {
        return this.max - this.min;
    }

    contains(x: number): boolean {
        return this.min <= x && x <= this.max;
    }

    surrounds(x: number): boolean {
        return this.min < x && x < this.max;
    }

    /**
     * align(4) size(8)
     * @returns {Float32Array}
     */
    encode(): Float32Array {
        const buffer = new Float32Array(2);

        buffer[0] = this.min;
        buffer[1] = this.max;

        return buffer;
    }
}