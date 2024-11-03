import AABB from "../classes/aabb";
import Ray from "../classes/ray";

export default interface GeometryOptions {
    center?: Ray,
    r?: number,
    materialIndex: number,
    bbox: AABB,
    id: number,
}