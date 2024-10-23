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
        boxes,
    }: AABBOptions = {}) {
        if (intervals) {
            const { x, y, z } = intervals;
            this.x = x;
            this.y = y;
            this.z = z;
        } else if (boxes) {
            const { box0, box1 } = boxes;
            this.x = new Interval({intervals: {a: box0.x, b: box1.x}});
            this.y = new Interval({intervals: {a: box0.y, b: box1.y}});
            this.z = new Interval({intervals: {a: box0.z, b: box1.z}});
        } else if (points) {
            const { a, b } = points;
            this.x = a.x <= b.x ? new Interval({numbers: {min: a.x, max: b.x}}) : new Interval({numbers: {min: b.x, max: a.x}});
            this.y = a.y <= b.y ? new Interval({numbers: {min: a.y, max: b.y}}) : new Interval({numbers: {min: b.y, max: a.y}});
            this.z = a.z <= b.z ? new Interval({numbers: {min: a.z, max: b.z}}) : new Interval({numbers: {min: b.z, max: a.z}});
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