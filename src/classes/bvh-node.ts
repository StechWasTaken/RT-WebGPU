import Hittable from "../interfaces/hittable";
import Serializable from "../interfaces/serializable";
import AABB from "./aabb";

export default class BVHNode implements Serializable, Hittable {
    static readonly SIZE: number = 12;

    bbox: AABB;
    left: number = -1;
    right: number = -1;
    objectIndex: number = -1;

    constructor(bbox: AABB) {
        this.bbox = bbox;
    }

    /**
     * explicit sizing and aligning for this struct!!!
     * align(16) size(48)
     * @returns {Float32Array}
     */
    encode(): Float32Array {
        const buffer = new Float32Array(BVHNode.SIZE);

        buffer.set(this.bbox.encode(), 0);
        buffer[8] = this.left;
        buffer[9] = this.right;
        buffer[10] = this.objectIndex;

        return buffer;
    }
}