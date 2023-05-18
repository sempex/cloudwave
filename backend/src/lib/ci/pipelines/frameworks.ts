import { z } from "zod";
import { nodeFramework } from "./node.js";
import { CustomBuildParams } from "../../../api/deploy/handler.js";

export interface Framework {
  displayName: string;
  builder: (props: BuildProps) => Promise<null | string>;
  buildOptions: BuildPropOptions[];
}
export interface BuildProps {
  git: string;
  name: string;
  buildParameter?: CustomBuildParams;
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

const FrameworkTypeOptions = Object.keys(frameworks) as [string, ...string[]];

export const FrameworkTypeOptionsEnum = z.enum(FrameworkTypeOptions);

export type FrameworkType = keyof typeof frameworks;
