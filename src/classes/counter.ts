import CounterOptions from "../interfaces/counter-options";
import Serializable from "../interfaces/serializable";

export default class Counter implements Serializable {
    static readonly MIN_SAFE_32F_INTEGER = -(Math.pow(2, 24) - 1);
    static readonly MAX_SAFE_32F_INTEGER = Math.pow(2, 24) - 1;

    count: number;
    previous: number;
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
        this.overflow = overflow;
        this.min = Counter.clamp(min, Counter.MIN_SAFE_32F_INTEGER, Counter.MAX_SAFE_32F_INTEGER);
        this.max = Counter.clamp(max, Counter.MIN_SAFE_32F_INTEGER, Counter.MAX_SAFE_32F_INTEGER);
        this.previous = this.count = this.start = this.handleOverflow(start);
    }

    private static clamp(a: number, min: number, max: number): number {
        return Math.min(max, Math.max(a, min));
    }

    private handleOverflow(value: number): number {
        if (this.overflow) {
            const range = this.range();

            if (value > this.max) {
                return this.min + ((value - this.min) % range);
            } else if (value < this.min) {
                return this.max - ((this.min - value) % range);
            }
        }

        return Counter.clamp(value, this.min, this.max);
    }

    delta(): number {
        const range = this.range();
        const difference = Math.abs(this.count - this.previous);
        
        if (difference > range / 2) {
            return range - difference;
        }
        
        return difference;
    }

    range(): number {
        return Math.abs(this.max - this.min + 1);
    }

    set(value: number): void {
        this.previous = this.count;
        this.count = this.handleOverflow(value);
    }

    up(value: number = 1): void {
        this.previous = this.count;
        this.count = this.handleOverflow(this.count + value);
    }

    down(value: number = 1): void {
        this.previous = this.count;
        this.count = this.handleOverflow(this.count - value);
    }

    reset(): void {
        this.previous = this.count = this.start;
    }

    encode(): Float32Array {
        return new Float32Array([this.count]);
    }
}