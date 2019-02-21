import * as fs from "fs";
import * as path from "path";
import ensure from "./ensure";

interface Frauderface {
  root: string;
  extension: string;
}

export default class Fraud implements Frauderface {
  root: string;
  extension: string;
  constructor(filePath: string, extension?: string) {
    this.root = filePath;
    this.extension = extension || "json";
    ensure(this.root);
  }
  getPath(fileName: string) {
    return path.join(this.root, `${fileName}.${this.extension}`);
  }
  exists(fileName: string) {
    return fs.existsSync(this.getPath(fileName));
  }
  list() {
    return fs
      .readdirSync(this.root)
      .filter((fileName: string) => fileName.endsWith(this.extension))
      .map((fileName: string) =>
        fileName.substring(0, fileName.length - 1 - this.extension.length)
      );
  }
  create(fileName: string, contents: any, overwrite?: true) {
    if (!overwrite && this.exists(fileName)) return;
    fs.writeFileSync(this.getPath(fileName), JSON.stringify(contents));
  }
  read(fileName: string) {
    try {
      return JSON.parse(fs.readFileSync(this.getPath(fileName)).toString());
    } catch (e) {
      return false;
    }
  }
  delete(fileName: string) {
    fs.unlinkSync(this.getPath(fileName));
  }
}
