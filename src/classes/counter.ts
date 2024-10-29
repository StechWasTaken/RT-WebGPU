import CounterOptions from "../interfaces/counter-options";
import Serializable from "../interfaces/serializable";

export default class Counter implements Serializable {
    static readonly MIN_SAFE_32F_INTEGER = -(Math.pow(2, 24) - 1);
    static readonly MAX_SAFE_32F_INTEGER = Math.pow(2, 24) - 1;

    count: number;
    start: number;
    min: number;
    max: number;

    constructor({
        start = 0,
        min = Counter.MIN_SAFE_32F_INTEGER,
        max = Counter.MAX_SAFE_32F_INTEGER,
    }: CounterOptions = {}) {
        this.min = Counter.clamp(min, Counter.MIN_SAFE_32F_INTEGER, Counter.MAX_SAFE_32F_INTEGER);
        this.max = Counter.clamp(max, Counter.MIN_SAFE_32F_INTEGER, Counter.MAX_SAFE_32F_INTEGER);
        this.start = Counter.clamp(start, min, max);
        this.count = this.start;
    }

    private static clamp(a: number, min: number, max: number): number {
        return Math.min(max, Math.max(a, min));
    }

    up(): void {
        this.count = Counter.clamp(this.count + 1, this.min, this.max);
    }

    down(): void {
        this.count = Counter.clamp(this.count - 1, this.min, this.max);
    }

    reset(value: number = this.start): void {
        this.count = Counter.clamp(value, this.min, this.max);
    }

    encode(): Float32Array {
        return new Float32Array([this.count]);
    }
}