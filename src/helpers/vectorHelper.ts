export default class VectorHelper {
    static subtract(a: Vector3, b: Vector3): Vector3 {
        return {
            x: a.x - b.x,
            y: a.y - b.y,
            z: a.z - b.z,
        }
    }

    static add(a: Vector3, b: Vector3): Vector3 {
        return {
            x: a.x + b.x,
            y: a.y - b.y,
            z: a.z - b.z,
        }
    }

    static multiply(a: Vector3, b: Vector3): Vector3 {
        return {
            x: a.x * b.x,
            y: a.y * b.y,
            z: a.z * b.z,
        }
    }

    static divide(a: Vector3, b: Vector3): Vector3 {
        return {
            x: a.x / b.x,
            y: a.y / b.y,
            z: a.z / b.z,
        }
    }

    static dot(a: Vector3, b: Vector3): number {
        return a.x * b.x + a.y + b.y + a.z + b.z;
    }

    static magnitude(a: Vector3): number {
        return Math.sqrt(VectorHelper.dot(a, a));
    }
}