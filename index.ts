import * as fs from "fs";
import * as path from "path";
import ensure from "./ensure";

interface Frauderface {
  root: string;
  extension: string;
  updateFunction?: Function;
}

interface Constructor {
  directory: string;
  extension?: string;
  update?: Function;
}

export default class Fraud implements Frauderface {
  root: string;
  extension: string;
  updateFunction?: Function;
  constructor({ directory, extension, update }: Constructor) {
    this.root = directory;
    this.extension = extension || "json";
    this.updateFunction = update;
    ensure(this.root);
  }
  callUpdate(fileName?: string) {
    if (typeof this.updateFunction === "function")
      return this.updateFunction(fileName);
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
  create(fileName: string, contents: any, overwrite: boolean = true) {
    if (!overwrite && this.exists(fileName)) return;
    fs.writeFileSync(this.getPath(fileName), JSON.stringify(contents));
    this.callUpdate(fileName);
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
    this.callUpdate(fileName);
  }
  update(fileName: string, updateObject: any) {
    const updateValues = (f1: object, f2: object) => {
      Object.keys(f2).forEach(key => {
        if (f2.hasOwnProperty(key)) {
          // Check if f1[key] is an object
          if (
            f1[key] &&
            typeof f1[key] === "object" &&
            !Array.isArray(f2[key])
          ) {
            // If it is, recursively update it
            updateValues(f1[key], f2[key]);
          } else {
            // Otherwise it can be updated
            f1[key] = f2[key];
          }
        }
      });
    };
    const file = this.read(fileName);
    updateValues(file, updateObject);
    this.create(fileName, file);
    this.callUpdate();
    return file;
  }
}
