import { ZodTypeAny, z } from "zod";
import { nodeFramework } from "./node.js";
import { staticFramework } from "./static.js";

export interface Framework<CustomBuildProps> {
  displayName: string;
  builder: (props: BuildProps<CustomBuildProps>) => Promise<null | string>;
  buildOptions: BuildPropOptions[];
  buildOptionsValidator: ZodTypeAny;
}
export interface BuildProps<CustomBuildProps> {
  git: string;
  name: string;
  branch: string;
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
]);

export type FrameworkTypes = keyof typeof frameworks;