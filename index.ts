import * as fs from "fs";
import * as path from "path";
import ensure from "./ensure";

interface Frauderface {
  filePath: string;
}

export default class Fraud implements Frauderface {
  filePath: string;
  constructor(filePath: string) {
    this.filePath = filePath;
    ensure(this.filePath);
  }
  create(fileName: string, contents: any) {
    fs.writeFileSync(
      path.join(this.filePath, `${fileName}.json`),
      JSON.stringify(contents)
    );
  }
}
