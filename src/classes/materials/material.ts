import MaterialOptions from "../../interfaces/material-options";
import Serializable from "../../interfaces/serializable";
import Vector3 from "../vector3";

export default abstract class Material implements Serializable {
    albedo: Vector3;
    fuzz: number;
    refractionIndex: number;
    id: number;

    constructor({
        albedo = new Vector3(0, 0, 0),
        fuzz = 0,
        refractionIndex = 0,
        id,
    }: MaterialOptions) {
        this.albedo = albedo;
        this.fuzz = fuzz;
        this.refractionIndex = refractionIndex;
        this.id = id;
    }

    /**
     * align(16) size(24)
     * @returns {Float32Array}
     */
    encode(): Float32Array {
        const buffer = new Float32Array(8);

        buffer.set(this.albedo.encode(), 0);
        buffer[3] = this.fuzz;
        buffer[4] = this.refractionIndex;
        buffer[5] = this.id;

        return buffer;
    }
}
