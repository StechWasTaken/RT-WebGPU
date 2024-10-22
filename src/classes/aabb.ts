import AABBOptions from "../interfaces/aabb-options";
import Serializable from "../interfaces/serializable";
import Interval from "./interval";

export default class AABB implements Serializable {
    x: Interval;
    y: Interval;
    z: Interval;

    constructor({
        intervals,
        points,
    }: AABBOptions = {}) {
        if (intervals) {
            const { x, y, z } = intervals;
            this.x = x;
            this.y = y;
            this.z = z;
        } else if (points) {
            const { a, b } = points;
            this.x = a.x <= b.x ? new Interval(a.x, b.x) : new Interval(b.x, a.x);
            this.y = a.y <= b.y ? new Interval(a.y, b.y) : new Interval(b.y, a.y);
            this.z = a.z <= b.z ? new Interval(a.z, b.z) : new Interval(b.z, a.z);
        } else {
            this.x = new Interval();
            this.y = new Interval();
            this.z = new Interval();
        }
    }

    axisInterval(n: number): Interval {
        switch(n) {
            case 1:
                return this.y;
            case 2:
                return this.z;
            default:
                return this.x;
        }
    }

    /**
     * align(4) size(24)
     * @returns {Float32Array}
     */
    encode(): Float32Array {
        const buffer = new Float32Array(6);

        buffer.set(this.x.encode(), 0);
        buffer.set(this.y.encode(), 2);
        buffer.set(this.z.encode(), 4);

        return buffer;
    }
}