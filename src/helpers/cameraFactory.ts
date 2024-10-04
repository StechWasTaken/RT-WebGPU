import VectorHelper from "./vectorHelper";

export default class CameraFactory {
    static createCameraData(camera: Camera): CameraData {
        const theta = camera.vfov * (Math.PI / 180.0);
        const h = Math.tan(theta / 2.0);
        const viewportHeight = 2.0 * h * camera.focusDistance;
        const viewportWidth = viewportHeight * (camera.imageWidth / camera.imageHeight);

        const w = VectorHelper.normalize(VectorHelper.subtract(camera.lookFrom, camera.lookAt));
        const u = VectorHelper.normalize(VectorHelper.cross(camera.vup, w));
        const v = VectorHelper.cross(w, u);

        const viewportU = VectorHelper.multiplyByScalar(u, viewportWidth);
        const viewportV = VectorHelper.multiplyByScalar(VectorHelper.negate(v), viewportHeight);
        
        const pixelDeltaU = VectorHelper.divideByScalar(viewportU, camera.imageWidth);
        const pixelDeltaV = VectorHelper.divideByScalar(viewportV, camera.imageHeight);

        const viewportUpperLeft = VectorHelper.subtract(
            VectorHelper.subtract(
                VectorHelper.subtract(
                    camera.lookFrom,
                    VectorHelper.multiplyByScalar(w, camera.focusDistance)
                ),
                VectorHelper.divideByScalar(
                    viewportU,
                    2.0
                )
            ),
            VectorHelper.divideByScalar(
                viewportV,
                2.0
            )
        );
        const pixel00Location = VectorHelper.add(
            viewportUpperLeft,
            VectorHelper.multiplyByScalar(
                VectorHelper.add(
                    pixelDeltaU,
                    pixelDeltaV
                ),
                0.5
            )
        )

        const defocusRadius = camera.focusDistance * Math.tan((camera.defocusAngle * (Math.PI / 180.0)) / 2);
        const defocusDiskU = VectorHelper.multiplyByScalar(u, defocusRadius);
        const defocusDiskV = VectorHelper.multiplyByScalar(v, defocusRadius);
        
        return {
            lookFrom: camera.lookFrom,
            padding1: 0,
            pixel00Location: pixel00Location,
            padding2: 0,
            pixelDeltaU: pixelDeltaU,
            padding3: 0,
            pixelDeltaV: pixelDeltaV,
            padding4: 0,
            defocusDiskU: defocusDiskU,
            padding5: 0,
            defocusDiskV: defocusDiskV,
            defocusAngle: camera.defocusAngle,
        }
    }
}