import Interval from "../classes/interval";

export default interface IntervalOptions {
    intervals?: {
        a: Interval;
        b: Interval;
    };
    numbers?: {
        min: number;
        max: number;
    };
}
