import { core } from "./k8s.js";

export default async function nsExists(ns: string) {
  try {
    const nsObject = await core.readNamespace(ns);
    return !!nsObject;
  } catch (err: any) {
    return false;
  }
}
