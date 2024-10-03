export default class SphereFactory {
    static createSphere(x: number, y: number, z: number, r: number, material: Material): Sphere {
        return {
            center: {
                x: x,
                y: y,
                z: z,
            },
            r: r,
            material: material,
        }
    }
}