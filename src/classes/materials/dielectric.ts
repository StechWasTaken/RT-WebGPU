import Material from "./material";

export default class Dielectric extends Material {
    static readonly ID: number = 3;
    
    constructor(refractionIndex: number) {
        super({
            refractionIndex: refractionIndex,
            id: Dielectric.ID,
        });
    }
}