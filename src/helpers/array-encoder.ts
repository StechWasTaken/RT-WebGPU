import Serializable from "../interfaces/serializable";

export default class ArrayEncoder {
    static encode(array: Array<Serializable>, stride: number): Float32Array {
        const buffer = new Float32Array(array.length * stride);

        for (let i = 0; i < array.length; i++) {
            buffer.set(array[i].encode(), i * stride);
        }

        return buffer;
    }
}