import Serializable from "../interfaces/serializable";
import Vector3 from "./vector3";

export default class CameraViewData implements Serializable {
    lookFrom: Vector3 = new Vector3(0,0,0);
    pixel00Location: Vector3 = new Vector3(0,0,0);
    pixelDeltaU: Vector3 = new Vector3(0,0,0);
    pixelDeltaV: Vector3 = new Vector3(0,0,0);
    defocusDiskU: Vector3 = new Vector3(0,0,0);
    defocusDiskV: Vector3 = new Vector3(0,0,0);
    defocusAngle: number = 0;
    size: number = 96;
    align: number = 16;

    constructor(
        lookFrom: Vector3,
        pixel00Location: Vector3,
        pixelDeltaU: Vector3,
        pixelDeltaV: Vector3,
        defocusDiskU: Vector3,
        defocusDiskV: Vector3,
        defocusAngle: number,
    ) {
        this.lookFrom = lookFrom;
        this.pixel00Location = pixel00Location;
        this.pixelDeltaU = pixelDeltaU;
        this.pixelDeltaV = pixelDeltaV;
        this.defocusDiskU = defocusDiskU;
        this.defocusDiskV = defocusDiskV;
        this.defocusAngle = defocusAngle;
    }

    /**
     * align(16) size(96)
     * @returns {Float32Array}
     */
    encode(): Float32Array {
        const buffer = new Float32Array(24);

        buffer.set(this.lookFrom.encode(), 0);
        buffer.set(this.pixel00Location.encode(), 4);
        buffer.set(this.pixelDeltaU.encode(), 8);
        buffer.set(this.pixelDeltaV.encode(), 12);
        buffer.set(this.defocusDiskU.encode(), 16);
        buffer.set(this.defocusDiskV.encode(), 20);
        buffer[23] = this.defocusAngle;

        return buffer;
    }
}