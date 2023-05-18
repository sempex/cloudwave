import { z } from "zod";
import { nodeFramework } from "./node.js";

export interface Framework<BuildProps> {
  displayName: string;
  builder: (props: BuildProps) => Promise<null | string>;
  userInput?: {
    id: string;
    name: string;
    required: boolean;
    default?: string;
  }[];
}

export const frameworks = {
  node: nodeFramework,
} as const;

const FrameworkTypeOptions = Object.keys(frameworks) as [string, ...string[]];

export const FrameworkTypeOptionsEnum = z.enum(FrameworkTypeOptions);

export type FrameworkType = keyof typeof frameworks;
