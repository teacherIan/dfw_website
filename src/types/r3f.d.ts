/**
 * TypeScript declarations for extended React Three Fiber elements
 * These declarations allow using custom Spark components in JSX
 */
declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        sparkRenderer: any;
        splatMesh: any;
      }
    }
  }
}

export {};
