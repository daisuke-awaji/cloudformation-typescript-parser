import { Template } from "cloudform-types";
import { findAndReplaceIf } from "find-and-replace-anything";

export const parse = (template: Template) => {
  const region = "ap-northeast-1";
  const accountId = "0000000000";

  function filterRef(foundVal) {
    if (foundVal.hasOwnProperty("Ref")) {
      if (!template.Parameters) {
        throw new Error(`Parameters is not defined.`);
      }
      if (!template.Parameters.hasOwnProperty(foundVal.Ref)) {
        throw new Error(`Parameter ${foundVal.Ref} is not defined.`);
      }
      return template.Parameters[foundVal.Ref].Default || "DEFAULT";
    }
    return foundVal;
  }

  function filterParams(foundVal) {
    if (typeof foundVal === "string") {
      if (template.Parameters) {
        Object.keys(template.Parameters).forEach((key) => {
          const value = template.Parameters![key].Default || "DEFAULT";
          if (typeof foundVal === "string") {
            foundVal = foundVal.replace("${" + key + "}", value);
          }
        });
      }
    }
    return foundVal;
  }

  function filterSub(foundVal) {
    if (foundVal.hasOwnProperty("Fn::Sub")) {
      if (!template.Parameters) {
        throw new Error(`Parameters is not defined.`);
      }
      if (Array.isArray(foundVal["Fn::Sub"])) {
        // foundVal is { 'Fn::Sub': [ '${Env}-ec2-sg-${AAA}', { AAA: [Object] } ] }
        const props = foundVal["Fn::Sub"][1];
        const key = Object.keys(props)[0];
        let value = props[key];
        value = findAndReplaceIf(value, filterRef);
        value = findAndReplaceIf(value, filterSub);
        value = findAndReplaceIf(value, filterFindInMap);
        value = findAndReplaceIf(value, arrayProps);
        value = findAndReplaceIf(value, filterParams);
        foundVal["Fn::Sub"][0] = foundVal["Fn::Sub"][0].replace(
          "${" + key + "}",
          value
        );

        return findAndReplaceIf(foundVal["Fn::Sub"][0], filterParams);
      }

      let result = foundVal["Fn::Sub"];
      Object.keys(template.Parameters).forEach((key) => {
        const value = template.Parameters![key].Default || "DEFAULT";
        if (typeof result === "string") {
          result = result.replace("${" + key + "}", value);
        }
      });

      if (typeof result === "string") {
        result = result.replace("${AWS::Region}", region ?? "us-east-1");
        result = result.replace("${AWS::AccountId}", accountId ?? "0000000000");

        // TODO
        result = result.replace("${", "");
        result = result.replace("}", "");
      }
      return result;
    }

    return foundVal;
  }

  function filterFindInMap(foundVal) {
    if (foundVal.hasOwnProperty("Fn::FindInMap")) {
      const [mapping, key, name] = foundVal["Fn::FindInMap"].map((item) =>
        findAndReplaceIf(item, filterRef)
      );

      return template.Mappings![mapping][key][name];
    }

    return foundVal;
  }

  function arrayProps(foundVal) {
    if (Array.isArray(foundVal)) {
      return foundVal.map((item) => {
        let result = item;
        result = findAndReplaceIf(result, filterRef);
        result = findAndReplaceIf(result, filterSub);
        result = findAndReplaceIf(result, filterFindInMap);
        return result;
      });
    }
    return foundVal;
  }

  template = findAndReplaceIf(template, filterRef);
  template = findAndReplaceIf(template, filterSub);
  template = findAndReplaceIf(template, filterFindInMap);
  template = findAndReplaceIf(template, arrayProps);
  return template;
};
