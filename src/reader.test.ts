import path from 'path';
import { readCfnFile } from '.';

describe('reader', () => {
  test('json', async () => {
    const template = await readCfnFile(
      path.join(__dirname, '../sample/security-group.json'),
    );
    expect(template).toMatchObject({
      AWSTemplateFormatVersion: '2010-09-09',
      Parameters: {
        VpcId: {
          Type: 'AWS::EC2::VPC::Id',
        },
        Env: {
          Type: 'String',
          AllowedValues: ['prod', 'stg', 'test'],
          Default: 'test',
        },
      },
      Mappings: {
        EnvMap: {
          prod: {
            cidr: '0.0.0.1/0',
          },
          stg: {
            cidr: '0.0.0.2/0',
          },
          test: {
            cidr: '0.0.0.3/0',
          },
        },
      },
      Resources: {
        SecurityGroupEc2: {
          Type: 'AWS::EC2::SecurityGroup',
          Properties: {
            GroupName: {
              'Fn::Sub': '${Env}-ec2-sg',
            },
            GroupDescription: 'for alb',
            SecurityGroupIngress: [
              {
                IpProtocol: 'tcp',
                FromPort: 80,
                ToPort: 80,
                CidrIp: {
                  'Fn::FindInMap': [
                    'EnvMap',
                    {
                      Ref: 'Env',
                    },
                    'cidr',
                  ],
                },
              },
            ],
            VpcId: {
              Ref: 'VpcId',
            },
            Tags: [
              {
                Key: 'Name',
                Value: {
                  'Fn::Sub': '${Env}-ec2-sg',
                },
              },
            ],
          },
        },
      },
    });
  });
});
