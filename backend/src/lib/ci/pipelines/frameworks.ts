import { ZodTypeAny, z } from "zod";
import { nodeFramework } from "./node.js";
import { staticFramework } from "./static.js";
import { nextjsFramework } from "./nextjs.js";

export interface Framework<CustomBuildProps> {
  displayName: string;
  icon: string;
  builder: (props: BuildProps<CustomBuildProps>) => Promise<null | string>;
  buildOptions: BuildPropOptions[];
  buildOptionsValidator: ZodTypeAny;
}
export interface BuildProps<CustomBuildProps> {
  git: string;
  name: string;
  branch: string;
  basePath?: string;
  buildParameters?: CustomBuildProps;
}

interface BuildPropOptions {
  id: string;
  name: string;
  required: boolean;
  default?: string;
}

export const frameworks = {
  node: nodeFramework,
  static: staticFramework,
  nextjs: nextjsFramework,
} as const;

export const buildParameterValidators = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("node"),
    buildParameters: frameworks["node"].buildOptionsValidator,
  }),
  z.object({
    type: z.literal("static"),
    buildParameters: frameworks["static"].buildOptionsValidator,
  }),
  z.object({
    type: z.literal("nextjs"),
    buildParameters: frameworks["nextjs"].buildOptionsValidator,
  }),
]);

export type FrameworkTypes = keyof typeof frameworks;
