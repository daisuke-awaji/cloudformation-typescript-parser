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

  function filterSub(foundVal) {
    if (foundVal.hasOwnProperty("Fn::Sub")) {
      if (!template.Parameters) {
        throw new Error(`Parameters is not defined.`);
      }

      let result = foundVal["Fn::Sub"];
      Object.keys(template.Parameters).forEach((key) => {
        const value = template.Parameters![key].Default || "DEFAULT";
        result = result.replace("${" + key + "}", value);
      });

      result = result.replace("${AWS::Region}", region ?? "us-east-1");
      result = result.replace("${AWS::AccountId}", accountId ?? "0000000000");

      // TODO
      result = result.replace("${", "");
      result = result.replace("}", "");

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

  template = findAndReplaceIf(template, filterRef);
  template = findAndReplaceIf(template, filterSub);
  template = findAndReplaceIf(template, filterFindInMap);
  return template;
};
