import { extend } from "@react-three/fiber";
import { SplatMesh as SparkSplatMesh } from "@sparkjsdev/spark";

// Register SplatMesh with R3F
extend({ SplatMesh: SparkSplatMesh });

// Export for TypeScript usage
export { SparkSplatMesh as SplatMesh };
