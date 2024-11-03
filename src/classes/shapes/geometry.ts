import GeometryOptions from "../../interfaces/geometry-options";
import Hittable from "../../interfaces/hittable";
import Serializable from "../../interfaces/serializable";
import AABB from "../aabb";
import Ray from "../ray";
import Vector3 from "../vector3";

export default abstract class Geometry implements Serializable, Hittable {
    static readonly SIZE: number = 16;

    center: Ray;
    r: number;
    materialIndex: number;
    bbox: AABB;
    id: number;

    constructor({
        center = Ray.ZERO,
        r = 0,
        materialIndex,
        bbox,
        id,
    }: GeometryOptions) {
        this.center = center;
        this.r = r;
        this.materialIndex = materialIndex;
        this.bbox = bbox;
        this.id = id;
    }

    /**
     * align(16) size(64)
     * @returns {Float32Array}
     */
    encode(): Float32Array {
        const buffer = new Float32Array(Geometry.SIZE);

        buffer.set(this.center.encode(), 0);
        buffer[8] = this.materialIndex;
        buffer[9] = this.r;
        buffer.set(this.bbox.encode(), 10);

        return buffer;
    }
}