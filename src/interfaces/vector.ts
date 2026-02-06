export default interface Vector<T> {
    add(other: T | number): T;
    subtract(other: T | number): T;
    divide(other: T | number): T;
    multiply(other: T | number): T;
    magnitude(): number;
    normalize(): T;
    negate(): T;
    dot(other: T): number;
    cross(other: T): T;
}
