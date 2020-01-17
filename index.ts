import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
import * as promiseSerial from "promise-serial";
import * as nodeCache from "node-cache";
import { NodeCache } from "node-cache/index";

interface Frauderface {
  root: string;
  extension: string;
  updateFunction?: Function;
  softDelete: boolean;
  allowDirectories: boolean;
  deletedPrefix: string;
  cache: NodeCache;
}

interface Constructor {
  directory: string;
  extension?: string;
  update?: Function;
  softDelete?: boolean;
  deletedPrefix?: string;
  stdTTL?: number;
  checkperiod?: number;
  allowDirectories?: boolean;
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
  softDelete: boolean;
  allowDirectories: boolean;
  deletedPrefix: string;
  cache: NodeCache;
  constructor({
    directory,
    extension,
    update,
    softDelete,
    deletedPrefix,
    stdTTL,
    checkperiod,
    allowDirectories
  }: Constructor) {
    this.root = directory;
    this.extension = extension || "json";
    this.updateFunction = update;
    this.allowDirectories = !!allowDirectories;
    this.softDelete = !!softDelete;
    this.deletedPrefix = deletedPrefix || "__deleted_";
    this.cache = new nodeCache({
      stdTTL,
      checkperiod: checkperiod || 0
    });
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
    if (!this.allowDirectories)
      fileName = fileName.replace(/\\/g, "").replace(/\\/g, "");
    return path.join(this.root, `${fileName}.${this.extension}`);
  }
  updateCache(fileName: string, contents?: Object): Promise<void> {
    if (contents) {
      return new Promise((resolve, reject) => {
        this.cache.set(fileName, contents, error => {
          if (error) return reject(error);
          resolve();
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        this.read(fileName)
          .then(value => {
            this.cache.set(fileName, value, error => {
              if (error) return reject(error);
              resolve();
            });
          })
          .catch(error => reject(error));
      });
    }
  }
  updateCacheSync(fileName: string, contents?: Object) {
    if (contents) {
      this.cache.set(fileName, contents);
    } else {
      this.cache.set(fileName, this.readSync(fileName));
    }
  }
  getCached(fileName: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this.cache.get(fileName, (error, value) => {
        if (error || !value) return reject(error);
        resolve(value);
      });
    });
  }
  getCachedSync(fileName: string): Object {
    return this.cache.get(fileName);
  }
  deleteCache(fileName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cache.del(fileName, error => {
        if (error) return reject(error);
        resolve();
      });
    });
  }
  deleteCacheSync(fileName: string) {
    return this.cache.del(fileName);
  }
  exists(fileName: string): Promise<boolean> {
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
  listCache(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.cache.keys((error, list) => {
        if (error) return reject(error);
        resolve(list);
      });
    });
  }
  listCacheSync() {
    return this.cache.keys();
  }
  list(): Promise<string[]> {
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
  readAll(): Promise<Object> {
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
    const contents: Object = {};
    files.forEach(file => {
      contents[file] = this.readSync(file);
    });
    return contents;
  }
  create(fileName: string, contents: any): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile(this.getPath(fileName), JSON.stringify(contents), error => {
        if (error) return reject(error);
        this.updateCache(fileName, contents)
          .then(() => this.callUpdate(fileName))
          .then(() => resolve())
          .catch(error => reject(error));
      });
    });
  }
  createSync(fileName: string, contents: any) {
    fs.writeFileSync(this.getPath(fileName), JSON.stringify(contents));
    this.updateCacheSync(fileName, contents);
    this.callUpdate(fileName);
  }
  read(fileName: string, detailed?: boolean): Promise<Object> {
    return new Promise((resolve, reject) => {
      this.getCached(fileName)
        .then(file =>
          resolve(detailed ? { ...file, details: { from: "cache" } } : file)
        )
        .catch(() => {
          fs.readFile(this.getPath(fileName), (error, file) => {
            if (error) return reject(error);
            try {
              if (detailed) {
                resolve({
                  ...JSON.parse(file.toString()),
                  details: { from: "storage" }
                });
              } else {
                resolve(JSON.parse(file.toString()));
              }
            } catch (error) {
              reject(error);
            }
          });
        });
    });
  }
  readSync(fileName: string, detailed?: boolean): Object {
    const contents = this.getCachedSync(fileName);
    if (contents && detailed)
      return { ...contents, details: { from: "cache" } };
    if (contents) return contents;
    try {
      if (detailed)
        return {
          ...JSON.parse(fs.readFileSync(this.getPath(fileName)).toString()),
          details: { from: "storage" }
        };
      return JSON.parse(fs.readFileSync(this.getPath(fileName)).toString());
    } catch (e) {
      return false;
    }
  }
  delete(fileName: string): Promise<void> {
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
          this.deleteCache(fileName);
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
      this.deleteCacheSync(fileName);
    }
    this.callUpdate(fileName);
  }
  rename(fileName: string, newFileName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.rename(this.getPath(fileName), this.getPath(newFileName), error => {
        if (error) return reject(error);
        this.read(fileName)
          .then(contents => this.updateCache(newFileName, contents))
          .then(() => this.callUpdate())
          .then(() => resolve())
          .catch(error => reject(error));
      });
    });
  }
  renameSync(fileName: string, newFileName: string) {
    fs.renameSync(this.getPath(fileName), this.getPath(newFileName));
    this.updateCacheSync(newFileName, this.readSync(fileName));
    this.deleteCacheSync(fileName);
    this.callUpdate(fileName);
  }
  update(fileName: string, updateObject: any): Promise<Object> {
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
