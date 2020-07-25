const fs = require("fs");
const csv = require("csvtojson");

const utils = {
  saveDataToFile: (filePath: String, data: any, cb: Function) => {
    const isCsv = filePath.endsWith(".csv");
    fs.writeFile(
      filePath,
      isCsv ? data : JSON.stringify(data),
      "utf8",
      (err: any) => {
        if (err) {
          return console.log(err);
        } else {
          if (isCsv) {
            csv().fromFile(filePath).then(cb);
          } else {
            cb(data);
          }
        }
      }
    );
  },
};

export default utils;
