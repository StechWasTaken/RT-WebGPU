import Interval from "../classes/interval"
import Vector3 from "../classes/vector3"

export default interface AABBOptions {
    intervals?: {
        x: Interval,
        y: Interval,
        z: Interval,
    },
    points?: {
        a: Vector3,
        b: Vector3,
    }
}