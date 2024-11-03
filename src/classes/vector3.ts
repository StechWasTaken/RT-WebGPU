import Serializable from "../interfaces/serializable";
import Vector from "../interfaces/vector";

export default class Vector3 implements Serializable, Vector<Vector3> {
    static readonly ZERO: Vector3 = new Vector3(0,0,0);

    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(other: number | Vector3): Vector3 {
        if (typeof other === 'number') {
            other = new Vector3(other, other, other);
        }

        return new Vector3(
            this.x + other.x, 
            this.y + other.y, 
            this.z + other.z,
        );
    }

    subtract(other: number | Vector3): Vector3 {
        if (typeof other === 'number') {
            other = new Vector3(other, other, other);
        }

        return new Vector3(
            this.x - other.x,
            this.y - other.y,
            this.z - other.z,
        );
    }

    divide(other: number | Vector3): Vector3 {
        if (typeof other === 'number') {
            other = new Vector3(other, other, other);
        }

        return new Vector3(
            this.x / other.x,
            this.y / other.y,
            this.z / other.z,
        );
    }

    multiply(other: number | Vector3): Vector3 {
        if (typeof other === 'number') {
            other = new Vector3(other, other, other);
        }

        return new Vector3(
            this.x * other.x,
            this.y * other.y,
            this.z * other.z,
        );
    }

    magnitude(): number {
        return Math.sqrt(this.dot(this));
    }

    normalize(): Vector3 {
        const magnitude = this.magnitude();

        if (magnitude === 0) {
            throw new Error("Cannot normalize a zero-length vector.");
        }

        return this.divide(magnitude);
    }

    negate(): Vector3 {
        return new Vector3(
            -this.x,
            -this.y,
            -this.z,
        );
    }

    dot(other: Vector3): number {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    cross(other: Vector3): Vector3 {
        return new Vector3(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x,
        )
    }

    /**
     * align(16) size(12)
     * @returns {Float32Array}
     */
    encode(): Float32Array {
        const buffer = new Float32Array(4);

        buffer[0] = this.x;
        buffer[1] = this.y;
        buffer[2] = this.z;

        return buffer;
    }
}