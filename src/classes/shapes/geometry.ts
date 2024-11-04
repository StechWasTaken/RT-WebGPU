import GeometryOptions from "../../interfaces/options/geometry-options";
import Hittable from "../../interfaces/hittable";
import Serializable from "../../interfaces/serializable";
import AABB from "../aabb";
import Ray from "../ray";
import Vector3 from "../vector3";

export default abstract class Geometry implements Serializable, Hittable {
    static readonly SIZE: number = 36;

    center: Ray;
    r: number;
    materialIndex: number;
    bbox: AABB;
    id: number;
    Q: Vector3;
    u: Vector3;
    v: Vector3;
    normal: Vector3;
    D: number;
    w: Vector3;

    constructor({
        center = Ray.ZERO,
        r = 0,
        Q = Vector3.ZERO,
        u = Vector3.ZERO,
        v = Vector3.ZERO,
        normal = Vector3.ZERO,
        D = 0,
        w = Vector3.ZERO,
        materialIndex,
        bbox,
        id,
    }: GeometryOptions) {
        this.center = center;
        this.r = r;
        this.Q = Q;
        this.u = u;
        this.v = v;
        this.normal = normal;
        this.D = D;
        this.w = w;
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
        buffer.set(this.Q.encode(), 16);
        buffer[19] = this.id;
        buffer.set(this.u.encode(), 20);
        buffer.set(this.v.encode(), 24);
        buffer.set(this.normal.encode(), 28);
        buffer[31] = this.D;
        buffer.set(this.w.encode(), 32);

        return buffer;
    }
}