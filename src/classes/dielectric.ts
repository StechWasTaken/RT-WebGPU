import Material from "./material";
import Vector3 from "./vector3";

export default class Dielectric extends Material {
    static readonly ID: number = 3;
    
    constructor(refractionIndex: number) {
        super({
            refractionIndex: refractionIndex,
            id: Dielectric.ID,
        });
    }
}