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
    refractionIndex: number,
    materialIndex: number,
    padding: Vector2,
}

interface Camera  {
    lookFrom: Vector3,
    fvov: number,
    lookAt: Vector3,
    defocusAngle: number,
    vup: Vector3,
    focusDistance: number,
    imageWidth: number,
    padding: Vector2,
    imageHeight: number,
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
  