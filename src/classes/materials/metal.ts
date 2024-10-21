import Material from "./material";
import Vector3 from "../vector3";

export default class Metal extends Material {
    static readonly ID: number = 2;

    constructor(albedo: Vector3, fuzz: number) {
        super({
            albedo: albedo,
            fuzz: fuzz,
            id: Metal.ID,
        });
    }
}