import Vector3 from "../../classes/vector3";
import AABB from "../../classes/aabb";
import Ray from "../../classes/ray";

export default interface GeometryOptions {
    center?: Ray,
    r?: number,
    Q?: Vector3,
    u?: Vector3,
    v?: Vector3,
    normal?: Vector3,
    D?: number,
    w?: Vector3,
    materialIndex: number,
    bbox: AABB,
    id: number,
}