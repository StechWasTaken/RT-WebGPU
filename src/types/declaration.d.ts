declare module '*.wgsl' {
    const value: string;
    export default value;
}

interface Sphere {
    center: Vector3,
    r: number,
    material: Material,
}

interface Material {
    albedo: Vector3,
    fuzz: number,
    materialIndex: number,
    padding: Vector3,
}

interface Vector4 {
    x: number,
    y: number,
    z: number,
    w: number,
}

interface Vector3 {
    x: number,
    y: number,
    z: number,
}

interface Vector2 {
    x: number,
    y: number,
}
  