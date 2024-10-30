import CounterOptions from "../interfaces/counter-options";
import Serializable from "../interfaces/serializable";

export default class Counter implements Serializable {
    static readonly MIN_SAFE_32F_INTEGER = -(Math.pow(2, 24) - 1);
    static readonly MAX_SAFE_32F_INTEGER = Math.pow(2, 24) - 1;

    count: number;
    start: number;
    min: number;
    max: number;
    overflow: boolean;

    constructor({
        start = 0,
        min = Counter.MIN_SAFE_32F_INTEGER,
        max = Counter.MAX_SAFE_32F_INTEGER,
        overflow = false,
    }: CounterOptions = {}) {
        this.min = Counter.clamp(min, Counter.MIN_SAFE_32F_INTEGER, Counter.MAX_SAFE_32F_INTEGER);
        this.max = Counter.clamp(max, Counter.MIN_SAFE_32F_INTEGER, Counter.MAX_SAFE_32F_INTEGER);
        this.start = Counter.clamp(start, min, max);
        this.count = this.start;
        this.overflow = overflow;
    }

    private static clamp(a: number, min: number, max: number): number {
        return Math.min(max, Math.max(a, min));
    }

    private handleOverflow(value: number) {
        if (this.overflow) {
            if (value > this.max) {
                return this.min + (value - this.max - 1);
            } else if (value < this.min) {
                return this.max - (this.min - value - 1);
            }
        }

        return Counter.clamp(value, this.min, this.max);
    }

    up(value: number = 1): void {
        this.count = this.handleOverflow(this.count + value);
    }

    down(value: number = 1): void {
        this.count = this.handleOverflow(this.count - value);
    }

    reset(value: number = this.start): void {
        this.count = Counter.clamp(value, this.min, this.max);
    }

    encode(): Float32Array {
        return new Float32Array([this.count]);
    }
}