const multer = require("multer");
const DatauriParser = require("datauri/parser");
const path = require("path");

const storage = multer.memoryStorage();
const multerUploads = multer({ storage }).single("image");

const parser = new DatauriParser();
const dataUri = (file) => parser.format(path.extname(file.originalname).toString(), file.buffer);

module.exports = { multerUploads, dataUri };
