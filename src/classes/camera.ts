import Serializable from "../interfaces/serializable";
import CameraViewData from "./camera-view-data";
import Vector3 from "./vector3";

export default class Camera implements Serializable {
    lookFrom: Vector3;
    lookAt: Vector3
    vup: Vector3;
    vfov: number;
    defocusAngle: number;
    focusDistance: number;
    imageWidth: number;
    imageHeight: number;

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
    }

    rotate(angularVelocity: number, deltaTime: number): void {
        const angle = angularVelocity * deltaTime / 1000;

        const radius = Math.sqrt(
            Math.pow(this.lookFrom.x - this.lookAt.x, 2) +
            Math.pow(this.lookFrom.z - this.lookAt.z, 2)
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

    computeViewData(): CameraViewData {
        const theta = this.vfov * (Math.PI / 180.0);
        const h = Math.tan(theta / 2.0);
        const viewportHeight = 2.0 * h * this.focusDistance;
        const viewportWidth = viewportHeight * (this.imageWidth / this.imageHeight);

        const w = this.lookFrom.subtract(this.lookAt).normalize();
        const u = this.vup.cross(w).normalize();
        const v = w.cross(u);

        const viewportU = u.multiply(viewportWidth);
        const viewportV = v.negate().multiply(viewportHeight);

        const pixelDeltaU = viewportU.divide(this.imageWidth);
        const pixelDeltaV = viewportV.divide(this.imageHeight);

        const viewportUpperLeft = this.lookFrom.subtract(w.multiply(this.focusDistance))
            .subtract(viewportU.divide(2.0))
            .subtract(viewportV.divide(2.0));

        const pixel00Location = viewportUpperLeft.add(pixelDeltaU.add(pixelDeltaV).multiply(0.5));

        const defocusRadius = this.focusDistance * Math.tan((this.defocusAngle * (Math.PI / 180.0)) / 2);
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
            this.defocusAngle   
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
