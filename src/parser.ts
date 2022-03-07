import { Template } from "cloudform-types";
import { findAndReplaceIf } from "find-and-replace-anything";

export const parse = (template: Template) => {
  const region = "ap-northeast-1";
  const accountId = "0000000000";

  function filterRef(val) {
    if (val.hasOwnProperty("Ref")) {
      if (!template.Parameters) {
        throw new Error(`Parameters is not defined.`);
      }
      return template.Parameters[val.Ref]?.Default || "DEFAULT";
    }
    return val;
  }

  function filterParams(val) {
    if (typeof val === "string") {
      if (template.Parameters) {
        Object.keys(template.Parameters).forEach((key) => {
          const value = template.Parameters![key].Default || "DEFAULT";
          if (typeof val === "string") {
            val = val.replace("${" + key + "}", value);
          }
        });
      }
    }
    return val;
  }

  function filterSub(val) {
    if (val.hasOwnProperty("Fn::Sub")) {
      if (!template.Parameters) {
        throw new Error(`Parameters is not defined.`);
      }
      if (Array.isArray(val["Fn::Sub"])) {
        // foundVal is { 'Fn::Sub': [ '${Env}-ec2-sg-${AAA}', { AAA: [Object] } ] }
        const props = val["Fn::Sub"][1];
        const key = Object.keys(props)[0];
        let value = props[key];
        value = replaceRecursively(value);
        val["Fn::Sub"][0] = val["Fn::Sub"][0].replace("${" + key + "}", value);

        return findAndReplaceIf(val["Fn::Sub"][0], filterParams);
      }

      let result = val["Fn::Sub"];
      Object.keys(template.Parameters).forEach((key) => {
        const value = template.Parameters![key].Default || "DEFAULT";
        if (typeof result === "string") {
          result = result.replace("${" + key + "}", value);
        }
      });

      if (typeof result === "string") {
        result = result.replace("${AWS::Region}", region ?? "us-east-1");
        result = result.replace("${AWS::AccountId}", accountId ?? "0000000000");
        result = result.replace("${", "");
        result = result.replace("}", "");
      }
      return result;
    }

    return val;
  }

  function filterFindInMap(val) {
    if (val.hasOwnProperty("Fn::FindInMap")) {
      const [mapping, key, name] = val["Fn::FindInMap"].map((item) =>
        replaceRecursively(item)
      );

      return template.Mappings![mapping][key][name];
    }

    return val;
  }

  function arrayProps(foundVal) {
    if (Array.isArray(foundVal)) {
      return foundVal.map((item) => replaceRecursively(item));
    }
    return foundVal;
  }

  function replaceRecursively(val) {
    val = findAndReplaceIf(val, filterRef);
    val = findAndReplaceIf(val, filterSub);
    val = findAndReplaceIf(val, filterFindInMap);
    val = findAndReplaceIf(val, arrayProps);
    return val;
  }

  return replaceRecursively(template);
};
