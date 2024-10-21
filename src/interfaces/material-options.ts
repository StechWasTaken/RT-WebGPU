import Vector3 from "../classes/vector3";

export default interface MaterialOptions {
    id: number;
    albedo?: Vector3;
    fuzz?: number;
    refractionIndex?: number;
}