import { readCfnFile } from "./reader";
import path from "path";
import { parse } from "./parser";

describe("parse", () => {
  test("Replace Valiables: Ref, Sub, FindInMap", async () => {
    const template = await readCfnFile(
      path.join(__dirname, "../sample/apigateway.yaml")
    );

    const parced = parse(template);

    expect(JSON.stringify(parced)).not.toContain("Ref");
    expect(JSON.stringify(parced)).not.toContain("Sub");
    expect(JSON.stringify(parced)).not.toContain("FindInMap");
    expect(parced).toMatchObject({
      AWSTemplateFormatVersion: "2010-09-09",
      Transform: "AWS::Serverless-2016-10-31",
      Description: "API Gateway\n",
      Mappings: {
        NLB: {
          prod: {
            v1: "http://prod-nlb.com",
          },
          stg: {
            v1: "http://stg-nlb.com",
          },
          test: {
            v1: "http://test-nlb.com",
          },
        },
        VPCLink: {
          prod: {
            v1: "prod-link",
          },
          stg: {
            v1: "stg-link",
          },
          test: {
            v1: "test-link",
          },
        },
      },
      Parameters: {
        Env: {
          Type: "String",
          AllowedValues: ["prod", "stg", "test"],
          Default: "test",
        },
        Stage: {
          Type: "String",
          AllowedValues: ["v1", "v2"],
          Default: "v1",
        },
      },
      Resources: {
        ApiGateway: {
          Type: "AWS::Serverless::Api",
          Properties: {
            Name: "test-api-v1",
            StageName: "v1",
            DefinitionUri: "../apigw.yml",
            EndpointConfiguration: "REGIONAL",
            MethodSettings: [
              {
                DataTraceEnabled: true,
                LoggingLevel: "INFO",
                ResourcePath: "/*",
                HttpMethod: "*",
              },
            ],
            Variables: {
              nlb: "http://test-nlb.com",
              vpcLinkId: "test-link",
            },
            MinimumCompressionSize: 1000,
            AccessLogSetting: {
              DestinationArn:
                "arn:aws:logs:ap-northeast-1:0000000000:log-group:API-Gateway-Access-Logs_ApiGateway/v1",
              Format:
                '{ "requestId":"$context.requestId", "ip": "$context.identity.sourceIp", "caller":"$context.identity.caller", "user":"$context.identity.user","requestTime":"$context.requestTime", "httpMethod":"$context.httpMethod","resourcePath":"$context.resourcePath", "status":"$context.status","protocol":"$context.protocol", "responseLength":"$context.responseLength" }',
            },
          },
        },
      },
      Outputs: {
        ApiGateway: {
          Description: "API Endpoint",
          Value:
            "https://ApiGateway.execute-api.ap-northeast-1.amazonaws.com/v1",
        },
      },
    });
  });
});
