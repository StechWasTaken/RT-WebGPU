import Material from "./material";
import Vector3 from "./vector3";

export default class Lambertian extends Material {
    static readonly ID: number = 1;

    constructor(albedo: Vector3) {
        super({
            albedo: albedo, 
            id: Lambertian.ID,
        });
    }
}