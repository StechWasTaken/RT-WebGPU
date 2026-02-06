import Serializable from "../interfaces/serializable";
import CameraViewData from "./camera-view-data";
import Vector3 from "./vector3";

export default class Camera implements Serializable {
    lookFrom: Vector3;
    lookAt: Vector3;
    vup: Vector3;
    vfov: number;
    defocusAngle: number;
    focusDistance: number;
    imageWidth: number;
    imageHeight: number;

    yaw: number = 0;
    pitch: number = 0;
    mouseSensitivity: number = 0.0025;

    constructor(
        lookFrom: Vector3,
        lookAt: Vector3,
        vup: Vector3,
        vfov: number,
        defocusAngle: number,
        focusDistance: number,
        imageWidth: number,
        imageHeight: number,
    ) {
        this.lookFrom = lookFrom;
        this.lookAt = lookAt;
        this.vup = vup;
        this.vfov = vfov;
        this.defocusAngle = defocusAngle;
        this.focusDistance = focusDistance;
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;

        this.initOrientationFromLook();
    }

    rotate(angularVelocity: number, deltaTime: number): void {
        const angle = (angularVelocity * deltaTime) / 1000;

        const radius = Math.sqrt(
            Math.pow(this.lookFrom.x - this.lookAt.x, 2) +
                Math.pow(this.lookFrom.z - this.lookAt.z, 2),
        );

        const currentAngle = Math.atan2(
            this.lookFrom.z - this.lookAt.z,
            this.lookFrom.x - this.lookAt.x,
        );

        const newAngle = currentAngle + angle;

        this.lookFrom.x = this.lookAt.x + radius * Math.cos(newAngle);
        this.lookFrom.z = this.lookAt.z + radius * Math.sin(newAngle);
    }

    zoom(delta: number): void {
        const direction = this.lookFrom.subtract(this.lookAt).normalize();

        const zoomSpeed = 0.01;
        const newDistance = direction.multiply(zoomSpeed * delta);

        this.lookFrom = this.lookFrom.add(newDistance);
    }

    translateLocal(direction: Vector3, distance: number): void {
        const forward = this.lookAt.subtract(this.lookFrom).normalize();
        const right = forward.cross(this.vup).normalize();
        const up = this.vup.normalize();

        const disp = right
            .multiply(direction.x * distance)
            .add(up.multiply(direction.y * distance))
            .add(forward.multiply(direction.z * distance));

        this.lookFrom = this.lookFrom.add(disp);
        this.lookAt = this.lookAt.add(disp);
    }

    initOrientationFromLook(): void {
        const dir = this.lookAt.subtract(this.lookFrom).normalize();
        this.pitch = Math.asin(Math.max(-1, Math.min(1, dir.y)));
        this.yaw = Math.atan2(dir.z, dir.x);
    }

    applyMouseDelta(
        movementX: number,
        movementY: number,
        sensitivity?: number,
    ): void {
        const s = sensitivity ?? this.mouseSensitivity;
        this.yaw += movementX * s;
        this.pitch -= movementY * s; // invert Y so moving mouse up looks up

        // clamp pitch slightly below +/-90deg to avoid gimbal flip
        const maxPitch = Math.PI / 2 - 0.001;
        if (this.pitch > maxPitch) this.pitch = maxPitch;
        if (this.pitch < -maxPitch) this.pitch = -maxPitch;

        this.updateLookAtFromYawPitch();
    }

    updateLookAtFromYawPitch(): void {
        const cosP = Math.cos(this.pitch);
        const forward = new Vector3(
            Math.cos(this.yaw) * cosP,
            Math.sin(this.pitch),
            Math.sin(this.yaw) * cosP,
        ).normalize();

        const lookAt = this.lookFrom.add(
            forward.multiply(this.focusDistance || 10),
        );
        this.lookAt = lookAt;
        this.vup = new Vector3(0, 1, 0);
    }

    moveFPS(x: number, y: number, z: number, dt: number, speed: number): void {
        const forwardXZ = new Vector3(
            Math.cos(this.yaw),
            0,
            Math.sin(this.yaw),
        ).normalize();
        const right = forwardXZ.cross(new Vector3(0, 1, 0)).normalize();
        const up = new Vector3(0, 1, 0);

        let lx = x;
        let ly = y;
        let lz = z;
        const len = Math.sqrt(lx * lx + ly * ly + lz * lz);
        if (len > 0) {
            lx /= len;
            ly /= len;
            lz /= len;
        }

        const movement = right
            .multiply(lx * speed * dt)
            .add(up.multiply(ly * speed * dt))
            .add(forwardXZ.multiply(lz * speed * dt));

        this.lookFrom = this.lookFrom.add(movement);
        this.lookAt = this.lookAt.add(movement);
    }

    computeViewData(): CameraViewData {
        const theta = this.vfov * (Math.PI / 180.0);
        const h = Math.tan(theta / 2.0);
        const viewportHeight = 2.0 * h * this.focusDistance;
        const viewportWidth =
            viewportHeight * (this.imageWidth / this.imageHeight);

        const w = this.lookFrom.subtract(this.lookAt).normalize();
        const u = this.vup.cross(w).normalize();
        const v = w.cross(u);

        const viewportU = u.multiply(viewportWidth);
        const viewportV = v.negate().multiply(viewportHeight);

        const pixelDeltaU = viewportU.divide(this.imageWidth);
        const pixelDeltaV = viewportV.divide(this.imageHeight);

        const viewportUpperLeft = this.lookFrom
            .subtract(w.multiply(this.focusDistance))
            .subtract(viewportU.divide(2.0))
            .subtract(viewportV.divide(2.0));

        const pixel00Location = viewportUpperLeft.add(
            pixelDeltaU.add(pixelDeltaV).multiply(0.5),
        );

        const defocusRadius =
            this.focusDistance *
            Math.tan((this.defocusAngle * (Math.PI / 180.0)) / 2);
        const defocusDiskU = u.multiply(defocusRadius);
        const defocusDiskV = v.multiply(defocusRadius);

        const data = new CameraViewData(
            this.lookFrom,
            pixel00Location,
            pixelDeltaU,
            pixelDeltaV,
            this.imageWidth,
            defocusDiskU,
            this.imageHeight,
            defocusDiskV,
            this.defocusAngle,
        );

        return data;
    }

    /**
     * align(16) size(64)
     * @returns {Float32Array}
     */
    encode(): Float32Array {
        const buffer = new Float32Array(16);

        buffer.set(this.lookFrom.encode(), 0);
        buffer[3] = this.vfov;
        buffer.set(this.lookAt.encode(), 4);
        buffer[7] = this.defocusAngle;
        buffer.set(this.vup.encode(), 8);
        buffer[11] = this.focusDistance;
        buffer[12] = this.imageWidth;
        buffer[13] = this.imageHeight;

        return buffer;
    }
}
