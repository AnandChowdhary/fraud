import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";

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

const updateValues = (f1: object, f2: object) => {
  Object.keys(f2).forEach(key => {
    if (f2.hasOwnProperty(key)) {
      if (f1[key] && typeof f1[key] === "object" && !Array.isArray(f2[key])) {
        updateValues(f1[key], f2[key]);
      } else {
        f1[key] = f2[key];
      }
    }
  });
};

export default class Fraud implements Frauderface {
  root: string;
  extension: string;
  updateFunction?: Function;
  constructor({ directory, extension, update }: Constructor) {
    this.root = directory;
    this.extension = extension || "json";
    this.updateFunction = update;
  }
  init() {
    return new Promise((resolve, reject) => {
      mkdirp(path.join(__dirname, this.root), error => {
        if (error) return reject(error);
        resolve();
      });
    });
  }
  callUpdate(fileName?: string) {
    if (typeof this.updateFunction === "function")
      return this.updateFunction(fileName);
  }
  getPath(fileName: string) {
    return path.join(this.root, `${fileName}.${this.extension}`);
  }
  exists(fileName: string) {
    return new Promise(resolve => {
      fs.exists(this.getPath(fileName), (exists: boolean) => resolve(exists));
    });
  }
  existsSync(fileName: string) {
    return fs.existsSync(this.getPath(fileName));
  }
  list() {
    return new Promise((resolve, reject) => {
      fs.readdir(this.root, (error, files) => {
        if (error) return reject(error);
        resolve(
          files
            .filter((fileName: string) => fileName.endsWith(this.extension))
            .map((fileName: string) =>
              fileName.substring(0, fileName.length - 1 - this.extension.length)
            )
        );
      });
    });
  }
  listSync() {
    return fs
      .readdirSync(this.root)
      .filter((fileName: string) => fileName.endsWith(this.extension))
      .map((fileName: string) =>
        fileName.substring(0, fileName.length - 1 - this.extension.length)
      );
  }
  create(fileName: string, contents: any) {
    return new Promise((resolve, reject) => {
      fs.writeFile(this.getPath(fileName), JSON.stringify(contents), error => {
        if (error) return reject(error);
        this.callUpdate(fileName);
        resolve();
      });
    });
  }
  createSync(fileName: string, contents: any) {
    fs.writeFileSync(this.getPath(fileName), JSON.stringify(contents));
    this.callUpdate(fileName);
  }
  read(fileName: string) {
    return new Promise((resolve, reject) => {
      fs.readFile(this.getPath(fileName), (error, file) => {
        if (error) return reject(error);
        try {
          resolve(JSON.parse(file.toString()));
        } catch (error) {
          reject(error);
        }
      });
    });
  }
  readSync(fileName: string) {
    try {
      return JSON.parse(fs.readFileSync(this.getPath(fileName)).toString());
    } catch (e) {
      return false;
    }
  }
  delete(fileName: string) {
    return new Promise((resolve, reject) => {
      fs.unlink(this.getPath(fileName), error => {
        if (error) return reject(error);
        this.callUpdate(fileName);
        resolve();
      });
    });
  }
  deleteSync(fileName: string) {
    fs.unlinkSync(this.getPath(fileName));
    this.callUpdate(fileName);
  }
  update(fileName: string, updateObject: any) {
    return new Promise((resolve, reject) => {
      this.read(fileName)
        .then(file => {
          updateValues(file, updateObject);
          this.create(fileName, file)
            .then(() => resolve())
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    });
  }
  updateSync(fileName: string, updateObject: any) {
    const file = this.readSync(fileName);
    updateValues(file, updateObject);
    this.createSync(fileName, file);
    this.callUpdate();
    return file;
  }
}
