import IntervalOptions from "../interfaces/interval-options";
import Serializable from "../interfaces/serializable";

export default class Interval implements Serializable {
    min: number;
    max: number;

    constructor({
        intervals,
        numbers,
    }: IntervalOptions = {}) {
        if (intervals) {
            const { a , b } = intervals;
            this.min = a.min <= b.min ? a.min : b.min;
            this.max = a.max >= b.max ? a.max : b.max;
        } else if (numbers) {
            const { min, max } = numbers;
            this.min = min;
            this.max = max;
        } else {
            this.min = Number.POSITIVE_INFINITY;
            this.max = Number.NEGATIVE_INFINITY;
        }
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