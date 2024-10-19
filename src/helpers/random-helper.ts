export default class RandomHelper {
    static randomRange(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    static random(): number {
        return Math.random();
    }

    static randomVector3(): Vector3 {
        return {
            x: RandomHelper.random(),
            y: RandomHelper.random(),
            z: RandomHelper.random(),
        }
    }
}