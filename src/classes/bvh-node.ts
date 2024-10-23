import RandomHelper from "../helpers/random-helper";
import Hittable from "../interfaces/hittable";
import Serializable from "../interfaces/serializable";
import AABB from "./aabb";

export default class BVHNode implements Serializable, Hittable {
    bbox: AABB;
    left: Hittable
    right: Hittable
    leftIndex: number = -1;
    rightIndex: number = -1;

    constructor(
        objects: Array<Hittable>,
        start: number = 0,
        end: number = objects.length,
    ) {
        const axis = Math.round(RandomHelper.randomRange(0, 2));

        const comparator = 
            axis == 0 ? BVHNode.boxXcompare :
            axis == 1 ? BVHNode.boxYcompare : BVHNode.boxZcompare;

        const objectSpan = end - start;

        if (objectSpan === 1) {
            this.left = this.right = objects[start];
        } else if (objectSpan === 2) {
            this.left = objects[start];
            this.right = objects[start + 1];
        } else {
            const mid = Math.floor(start + objectSpan / 2);
            const sortedObjects = objects.slice(start, end).sort(comparator);

            objects.splice(start, objectSpan, ...sortedObjects);

            this.left = new BVHNode(objects, start, mid);
            this.right = new BVHNode(objects, mid, end);
        }

        this.bbox = new AABB({
            boxes: {
                box0: this.left.bbox,
                box1: this.right.bbox,
            }
        });
    }

    static boxCompare(a: Hittable, b: Hittable, axisIndex: number): number {
        const aAxisInterval = a.bbox.axisInterval(axisIndex);
        const bAxisInterval = b.bbox.axisInterval(axisIndex);
        return aAxisInterval.min - bAxisInterval.min;
    }

    static boxXcompare(a: Hittable, b: Hittable): number {
        return BVHNode.boxCompare(a, b, 0);
    }

    static boxYcompare(a: Hittable, b: Hittable): number {
        return BVHNode.boxCompare(a, b, 1);
    }

    static boxZcompare(a: Hittable, b: Hittable): number {
        return BVHNode.boxCompare(a, b, 2);
    }

    encode(): Float32Array {
        throw new Error("Method not implemented.");
    }
}