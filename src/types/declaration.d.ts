declare module '*.wgsl' {
    const value: string;
    export default value;
}

interface Sphere {
    center: Ray,
    materialIndex: number,
    r: number,
    padding: Vector2,
}

interface Ray {
    origin: Vector3,
    time: number,
    direction: Vector3,
    padding: number,
}

interface Material {
    albedo: Vector3,
    fuzz: number,
    refractionIndex: number,
    id: number,
    padding: Vector2,
}

interface Camera  {
    lookFrom: Vector3,
    vfov: number,
    lookAt: Vector3,
    defocusAngle: number,
    vup: Vector3,
    focusDistance: number,
    imageWidth: number,
    imageHeight: number,
}

interface CameraViewData {
    lookFrom: Vector3,
    pixel00Location: Vector3,
    pixelDeltaU: Vector3,
    pixelDeltaV: Vector3,
    defocusDiskU: Vector3,
    defocusDiskV: Vector3,
    defocusAngle: number,
}

interface ShaderConfig {
    maxBounces: number,
    samplesPerPixel: number,
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
  