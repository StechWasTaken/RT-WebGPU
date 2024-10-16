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
            y: a.y + b.y,
            z: a.z + b.z,
        }
    }

    static addScalar(a: Vector3, scalar: number): Vector3 {
        return {
            x: a.x + scalar,
            y: a.y + scalar,
            z: a.z + scalar,
        }
    }

    static multiply(a: Vector3, b: Vector3): Vector3 {
        return {
            x: a.x * b.x,
            y: a.y * b.y,
            z: a.z * b.z,
        }
    }

    static multiplyByScalar(a: Vector3, scalar: number): Vector3 {
        return {
            x: a.x * scalar,
            y: a.y * scalar,
            z: a.z * scalar,
        }
    }

    static divideByScalar(a: Vector3, scalar: number): Vector3 {
        return {
            x: a.x / scalar,
            y: a.y / scalar,
            z: a.z / scalar,
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
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    static magnitude(a: Vector3): number {
        return Math.sqrt(VectorHelper.dot(a, a));
    }

    static normalize(a: Vector3): Vector3 {
        const magnitude = VectorHelper.magnitude(a);

        if (magnitude === 0) {
            throw new Error("Cannot normalize a zero-length vector.");
        }

        return {
            x: a.x / magnitude,
            y: a.y / magnitude,
            z: a.z / magnitude,
        }
    }

    static negate(a: Vector3): Vector3 {
        return {
            x: -a.x,
            y: -a.y,
            z: -a.z,
        }
    }

    static cross(a: Vector3, b: Vector3): Vector3 {
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x,
        }
    }
}