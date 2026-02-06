import Serializable from "../../interfaces/serializable";

export default class Square implements Serializable {
    encode(): Float32Array {
        return new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]);
    }
}
