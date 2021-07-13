import { Template } from "cloudform-types";
import { yamlParse } from "yaml-cfn";
import * as fs from "fs";
import { promisify } from "util";

export const readCfnFileSync = (path: string): Template => {
  const templateFile = fs.readFileSync(path, "utf-8");
  return yamlParse(templateFile);
};

export const readCfnFile = async (path: string): Promise<Template> => {
  const templateFile = await promisify(fs.readFile)(path, "utf-8");
  return yamlParse(templateFile);
};
