import { extend } from "@react-three/fiber";
import { SparkRenderer as SparkSparkRenderer } from "@sparkjsdev/spark";

// Register SparkRenderer with R3F
extend({ SparkRenderer: SparkSparkRenderer });

// Export for TypeScript usage
export { SparkSparkRenderer as SparkRenderer };
