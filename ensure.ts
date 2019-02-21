import * as fs from "fs";
import * as path from "path";

/**
 * Creates an empty folder if it doesn't exists in the given path
 * @param filePath - Given path for folder
 */
const ensure = (filePath: string) => {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensure(dirname);
  fs.mkdirSync(dirname);
};

export default ensure;
