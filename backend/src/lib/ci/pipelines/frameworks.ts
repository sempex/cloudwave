import { ZodTypeAny, z } from "zod";
import { nodeFramework } from "./node.js";

export interface Framework<CustomBuildProps> {
  displayName: string;
  builder: (props: BuildProps<CustomBuildProps>) => Promise<null | string>;
  buildOptions: BuildPropOptions[];
  buildOptionsValidator: ZodTypeAny;
}
export interface BuildProps<CustomBuildProps> {
  git: string;
  name: string;
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
} as const;

export const buildParameterValidators = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("node"),
    buildParameters: frameworks["node"].buildOptionsValidator,
  }),
]);

export type FrameworkTypes = keyof typeof frameworks;
