declare module "*.mdx" {
  import type { ComponentType } from "react";

  const MDXComponent: ComponentType<Record<string, unknown>>;
  export default MDXComponent;

  export const profile: any;
  export const publications: any;
  export const education: any;
}
