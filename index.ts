import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
import * as promiseSerial from "promise-serial";

interface Frauderface {
  root: string;
  extension: string;
  updateFunction?: Function;
  softDelete: Boolean;
  deletedPrefix: string;
}

interface Constructor {
  directory: string;
  extension?: string;
  update?: Function;
  softDelete?: Boolean;
  deletedPrefix?: string;
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
  softDelete: Boolean;
  deletedPrefix: string;
  constructor({
    directory,
    extension,
    update,
    softDelete,
    deletedPrefix
  }: Constructor) {
    this.root = directory;
    this.extension = extension || "json";
    this.updateFunction = update;
    this.softDelete = !!softDelete;
    this.deletedPrefix = deletedPrefix || "__deleted_";
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
      if (this.softDelete && fileName.startsWith(this.deletedPrefix))
        return resolve(false);
      fs.exists(this.getPath(fileName), (exists: boolean) => resolve(exists));
    });
  }
  existsSync(fileName: string) {
    if (this.softDelete && fileName.startsWith(this.deletedPrefix))
      return false;
    return fs.existsSync(this.getPath(fileName));
  }
  list() {
    return new Promise((resolve, reject) => {
      fs.readdir(this.root, (error, files) => {
        if (error) return reject(error);
        resolve(
          files
            .filter((fileName: string) =>
              this.softDelete
                ? fileName.endsWith(this.extension) &&
                  !fileName.startsWith(this.deletedPrefix)
                : fileName.endsWith(this.extension)
            )
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
      .filter((fileName: string) =>
        this.softDelete
          ? fileName.endsWith(this.extension) &&
            !fileName.startsWith(this.deletedPrefix)
          : fileName.endsWith(this.extension)
      )
      .map((fileName: string) =>
        fileName.substring(0, fileName.length - 1 - this.extension.length)
      );
  }
  readAll() {
    return new Promise((resolve, reject) => {
      const contents = {};
      this.list()
        .then((files: string[]) => {
          const promises = files.map((file: string) => () =>
            new Promise((resolve, reject) => {
              this.read(file)
                .then(text => {
                  contents[file] = text;
                  resolve(text);
                })
                .catch(error => reject(error));
            })
          );
          promiseSerial(promises)
            .then(() => resolve(contents))
            .catch((error: any) => reject(error));
        })
        .catch(error => reject(error));
    });
  }
  readAllSync() {
    const files = this.listSync();
    const contents = {};
    files.forEach(file => {
      contents[file] = this.readSync(file);
    });
    return contents;
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
    if (this.softDelete) {
      return new Promise((resolve, reject) => {
        this.rename(fileName, this.deletedPrefix + fileName)
          .then(() => {
            this.callUpdate(fileName);
            resolve();
          })
          .catch(error => reject(error));
      });
    } else {
      return new Promise((resolve, reject) => {
        fs.unlink(this.getPath(fileName), error => {
          if (error) return reject(error);
          this.callUpdate(fileName);
          resolve();
        });
      });
    }
  }
  deleteSync(fileName: string) {
    if (this.softDelete) {
      this.renameSync(fileName, this.deletedPrefix + fileName);
    } else {
      fs.unlinkSync(this.getPath(fileName));
    }
    this.callUpdate(fileName);
  }
  rename(fileName: string, newFileName: string) {
    return new Promise((resolve, reject) => {
      fs.rename(this.getPath(fileName), this.getPath(newFileName), error => {
        if (error) return reject(error);
        this.callUpdate(fileName);
        resolve();
      });
    });
  }
  renameSync(fileName: string, newFileName: string) {
    fs.renameSync(this.getPath(fileName), this.getPath(newFileName));
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
