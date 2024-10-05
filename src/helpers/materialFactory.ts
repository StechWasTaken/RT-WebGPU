export default class MaterialFactory {
    static createLambertian(albedo: Vector3): Material {
        return {
            albedo: albedo,
            fuzz: 0,
            refractionIndex: 0,
            id: 1,
            padding: {
                x: 0,
                y: 0,
            }
        }
    }

    static createMetal(albedo: Vector3, fuzz: number): Material {
        return {
            albedo: albedo,
            fuzz: fuzz,
            refractionIndex: 0,
            id: 2,
            padding: {
                x: 0,
                y: 0,
            }
        }
    }

    static createDielectric(refractionIndex: number): Material {
        return {
            albedo: {
                x: 0,
                y: 0,
                z: 0,
            },
            fuzz: 0,
            refractionIndex: refractionIndex,
            id: 3,
            padding: {
                x: 0,
                y: 0,
            }
        }
    }
}