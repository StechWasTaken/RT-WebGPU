import Serializable from "../interfaces/serializable";

export default class ShaderConfig implements Serializable {
    maxBounces: number;
    samplesPerPixel: number;

    constructor(
        maxBounces: number,
        samplesPerPixel: number,
    ) {
        this.maxBounces = maxBounces;
        this.samplesPerPixel = samplesPerPixel;
    }

    /**
     * align(4) size(8);
     * @returns {Float32Array}
     */
    encode(): Float32Array {
        const buffer = new Float32Array(2);

        buffer[0] = this.maxBounces;
        buffer[1] = this.samplesPerPixel;

        return buffer;
    }
}
