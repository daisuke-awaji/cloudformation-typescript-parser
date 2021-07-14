# cloudformation-typescript-parser

<p align="center">
  <img src="https://github.com/daisuke-awaji/cloudformation-typescript-parser/raw/main/media/cloudformation-typescript-parser.png" width="500" alt="logo" />
</p>

<p align="center">Parse CloudFormation template into TypeScript.</p>

## Features

📜 **Read** CloudFormation Template from yaml. <br>
🖍 **Mapping** Valiables into template on TypeScript Object <br>
🐤 **TypeScript** Support

## Installation

```bash
npm install cloudformation-typescript-parser
```

or

```bash
yarn add cloudformation-typescript-parser
```

## Usage

### Basic Usage

Read and parse CloudFormation Template

```ts
import { parseCfnFile } from "cloudformation-typescript-parser";

const template = await parseCfnFile(path.join(__dirname, "./cfn/tmeplate.yaml");
```

`cfn/template.yaml`

```yaml
---
AWSTemplateFormatVersion: "2010-09-09"

Parameters:
  VpcId:
    Type: AWS::EC2::VPC::Id
  Env:
    Type: String
    AllowedValues:
      - prod
      - stg
      - test
    Default: test

Mappings:
  EnvMap:
    prod:
      cidr: "0.0.0.1/0"
    stg:
      cidr: "0.0.0.2/0"
    test:
      cidr: "0.0.0.3/0"

Resources:
  SecurityGroupEc2:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub "${Env}-ec2-sg"
      GroupDescription: for alb
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !FindInMap [EnvMap, !Ref Env, cidr]
      VpcId: !Ref VpcId
      Tags:
        - Key: Name
          Value: !Sub "${Env}-ec2-sg"
```

The result of parsing

```ts
{
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
}
```
