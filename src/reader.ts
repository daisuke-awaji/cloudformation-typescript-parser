import { Template } from 'cloudform-types';
import { yamlParse } from 'yaml-cfn';
import * as fs from 'fs';
import { promisify } from 'util';
import p from 'path';

export const readCfnFile = async (path: string): Promise<Template> => {
  return new CfnFileContext(path).read();
};

class CfnFileContext {
  private reader: CfnFileReader;
  constructor(protected path: string) {
    switch (p.extname(path)) {
      case '.yaml' || '.yml':
        this.reader = new CfnYamlReader(path);
        break;
      case '.json':
        this.reader = new CfnJsonReader(path);
        break;
      default:
        throw new Error(
          'unsurpported file extension. surpported file extention: .json, .yaml, .yml',
        );
    }
  }
  async read(): Promise<Template> {
    return this.reader.read();
  }
}

abstract class CfnFileReader {
  constructor(protected path: string) {}
  abstract read(): Promise<Template>;
}

class CfnYamlReader extends CfnFileReader {
  constructor(protected path: string) {
    super(path);
  }
  async read() {
    const templateFile = await promisify(fs.readFile)(this.path, 'utf-8');
    return yamlParse(templateFile);
  }
}

class CfnJsonReader extends CfnFileReader {
  constructor(protected path: string) {
    super(path);
  }
  async read() {
    const templateFile = await promisify(fs.readFile)(this.path, 'utf-8');
    return JSON.parse(templateFile) as Template;
  }
}
