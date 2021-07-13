import { parse } from "./parser";
import { readCfnFile } from "./reader";
import { Template } from "cloudform-types";

export * from "cloudform-types";
export * from "./parser";
export * from "./reader";

type ParseCfnFileOption = {
  mapping?: boolean;
};

export const parseCfnFile = async (
  path: string,
  opt?: ParseCfnFileOption
): Promise<Template> => {
  const template = await readCfnFile(path);
  const mapping = opt?.mapping ?? true;
  return mapping ? parse(template) : template;
};
