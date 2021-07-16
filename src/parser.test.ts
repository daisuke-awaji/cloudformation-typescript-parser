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

  test("Replace Valiables: Ref, Sub, FindInMap 2", async () => {
    const template = await readCfnFile(
      path.join(__dirname, "../sample/cloudfront.yaml")
    );

    const parced = parse(template);
    const parsedStr = JSON.stringify(parced);
    expect(parsedStr).not.toContain("Ref");
    expect(parsedStr).not.toContain("Sub");
    expect(parsedStr).not.toContain("FindInMap");
    expect(parced).toMatchObject({
      AWSTemplateFormatVersion: "2010-09-09",
      Parameters: {
        Env: {
          Type: "String",
          AllowedValues: ["prod", "test"],
          Default: "test",
        },
      },
      Mappings: {
        CloudFront: {
          Alias: {
            prod: "a.com",
            test: "b.com",
          },
          AcmCertificateArn: {
            prod: "arn",
            test: "arn",
          },
        },
      },
      Resources: {
        S3Bucket: {
          Type: "AWS::S3::Bucket",
          Properties: {
            AccessControl: "PublicRead",
            BucketName: "test-bucket",
            WebsiteConfiguration: {
              IndexDocument: "spec.html",
              ErrorDocument: "error.html",
            },
          },
        },
        BucketPolicy: {
          Type: "AWS::S3::BucketPolicy",
          Properties: {
            Bucket: "DEFAULT",
            PolicyDocument: {
              Statement: [
                {
                  Action: ["s3:GetObject"],
                  Effect: "Allow",
                  Resource: "arn:aws:s3:::S3Bucket/*",
                  Principal: {
                    CanonicalUser: {
                      "Fn::GetAtt": [
                        "CloudFrontOriginAccessIdentity",
                        "S3CanonicalUserId",
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        CloudFrontOriginAccessIdentity: {
          Type: "AWS::CloudFront::CloudFrontOriginAccessIdentity",
          Properties: {
            CloudFrontOriginAccessIdentityConfig: {
              Comment: "access identity",
            },
          },
        },
        CloudFrontDistribution: {
          Type: "AWS::CloudFront::Distribution",
          DependsOn: ["CloudFrontOriginAccessIdentity"],
          Properties: {
            DistributionConfig: {
              Enabled: true,
              Aliases: ["b.com"],
              ViewerCertificate: {
                AcmCertificateArn: "arn",
                SslSupportMethod: "sni-only",
              },
              DefaultCacheBehavior: {
                AllowedMethods: ["HEAD", "GET"],
                CachedMethods: ["HEAD", "GET"],
                DefaultTTL: 0,
                MaxTTL: 0,
                MinTTL: 0,
                TargetOriginId: "test-bucket-Origin",
                ViewerProtocolPolicy: "redirect-to-https",
                ForwardedValues: {
                  QueryString: false,
                },
              },
              IPV6Enabled: true,
              HttpVersion: "http2",
              DefaultRootObject: "spec.html",
              Origins: [
                {
                  Id: "test-bucket-Origin",
                  DomainName: {
                    "Fn::GetAtt": ["S3Bucket", "DomainName"],
                  },
                  S3OriginConfig: {
                    OriginAccessIdentity:
                      "origin-access-identity/cloudfront/CloudFrontOriginAccessIdentity",
                  },
                },
              ],
              CustomErrorResponses: [
                {
                  ErrorCachingMinTTL: 0,
                  ErrorCode: 403,
                },
              ],
            },
          },
        },
      },
    });
  });
});
