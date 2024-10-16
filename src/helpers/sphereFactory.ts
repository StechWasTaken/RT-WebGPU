import VectorHelper from "./vectorHelper";

export default class SphereFactory {
    static createStationarySphere(center: Vector3, r: number, materialIndex: number): Sphere {
        return {
            center: {
                origin: center,
                time: 0,
                direction: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
                padding: 0,
            },
            materialIndex: materialIndex,
            r: r,
            padding: {
                x: 0,
                y: 0,
            }
        }
    }

    static createMovingSphere(center1: Vector3, center2: Vector3, r: number, materialIndex: number): Sphere {
        const sphere = SphereFactory.createStationarySphere(center1, r, materialIndex);

        const direction = VectorHelper.subtract(center2, center1);

        sphere.center.direction = direction;

        return sphere;
    }
}