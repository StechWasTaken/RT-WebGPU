export default class SphereFactory {
    static createSphere(x: number, y: number, z: number, r: number, materialIndex: number): Sphere {
        return {
            center: {
                x: x,
                y: y,
                z: z,
            },
            r: r,
            materialIndex: materialIndex,
            padding: {
                x: 0,
                y: 0,
                z: 0,
            }
        }
    }
}