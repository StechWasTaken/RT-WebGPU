import Vector3 from "../classes/vector3";

export default class RandomHelper {
    static randomRange(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    static randomVector3(min: number = 0, max: number = 1): Vector3 {
        return new Vector3(Math.random(), Math.random(), Math.random());
    }
}
