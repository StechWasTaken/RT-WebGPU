export default class CameraHelper {
    static rotateCamera(camera: Camera, deltaTime: number, rotationVelocity: number) {
        const angle = rotationVelocity * deltaTime / 1000; // dividing by 1000 converts deltaTime to seconds

        const radius = Math.sqrt(
            Math.pow(camera.lookFrom.x - camera.lookAt.x, 2) +
            Math.pow(camera.lookFrom.z - camera.lookAt.z, 2)
        );

        const currentAngle = Math.atan2(
            camera.lookFrom.z - camera.lookAt.z,
            camera.lookFrom.x - camera.lookAt.x
        );

        const newAngle = currentAngle + angle;

        camera.lookFrom.x = camera.lookAt.x + radius * Math.cos(newAngle);
        camera.lookFrom.z = camera.lookAt.z + radius * Math.sin(newAngle);
    }
}