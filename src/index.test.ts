import { parseCfnFile } from "./index";
import path from "path";

describe("index", () => {
  test("Replace Valiables: Ref, Sub, FindInMap", async () => {
    const parced = await parseCfnFile(
      path.join(__dirname, "../sample/apigateway.yaml")
    );

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
  test("parse array properties security-group.yml", async () => {
    const template = await parseCfnFile(
      path.join(__dirname, "../sample/security-group.yaml")
    );

    expect(JSON.stringify(template)).not.toContain("Ref");
    expect(JSON.stringify(template)).not.toContain("Sub");
    expect(JSON.stringify(template)).not.toContain("FindInMap");
    expect(template).toMatchObject({
      AWSTemplateFormatVersion: "2010-09-09",
      Parameters: {
        VpcId: {
          Type: "AWS::EC2::VPC::Id",
        },
        Env: {
          Type: "String",
          AllowedValues: ["prod", "stg", "test"],
          Default: "test",
        },
      },
      Mappings: {
        EnvMap: {
          prod: {
            cidr: "0.0.0.1/0",
          },
          stg: {
            cidr: "0.0.0.2/0",
          },
          test: {
            cidr: "0.0.0.3/0",
          },
        },
      },
      Resources: {
        SecurityGroupEc2: {
          Type: "AWS::EC2::SecurityGroup",
          Properties: {
            GroupName: "test-ec2-sg",
            GroupDescription: "for alb",
            SecurityGroupIngress: [
              {
                IpProtocol: "tcp",
                FromPort: 80,
                ToPort: 80,
                CidrIp: "0.0.0.3/0",
              },
            ],
            VpcId: "DEFAULT",
            Tags: [
              {
                Key: "Name",
                Value: "test-ec2-sg",
              },
            ],
          },
        },
      },
    });
  });

  test.only("parse sub array", async () => {
    const template = await parseCfnFile(
      path.join(__dirname, "../sample/array-sub.yaml")
    );

    expect(JSON.stringify(template)).not.toContain("Ref");
    expect(JSON.stringify(template)).not.toContain("Sub");
    expect(JSON.stringify(template)).not.toContain("FindInMap");

    expect(template).toMatchObject({
      AWSTemplateFormatVersion: "2010-09-09",
      Parameters: {
        VpcId: {
          Type: "AWS::EC2::VPC::Id",
        },
        Env: {
          Type: "String",
          AllowedValues: ["prod", "stg", "test"],
          Default: "test",
        },
      },
      Mappings: {
        EnvMap: {
          prod: {
            cidr: "0.0.0.1/0",
            suf: "prod",
          },
          stg: {
            cidr: "0.0.0.2/0",
            suf: "stg",
          },
          test: {
            cidr: "0.0.0.3/0",
            suf: "test",
          },
        },
      },
      Resources: {
        SecurityGroupEc2: {
          Type: "AWS::EC2::SecurityGroup",
          Properties: {
            GroupName: "test-ec2-sg",
            GroupDescription: "for alb",
            SecurityGroupIngress: [
              {
                IpProtocol: "tcp",
                FromPort: 80,
                ToPort: 80,
                CidrIp: "0.0.0.3/0",
              },
            ],
            VpcId: "DEFAULT",
            Tags: [
              {
                Key: "Name",
                Value: "test-ec2-sg-test",
              },
            ],
          },
        },
      },
    });
  });
});
