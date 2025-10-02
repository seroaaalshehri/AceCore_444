const multer = require("multer");
const path = require("path");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../storage/avatars"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = Date.now() + "-" + file.fieldname + ext;
    cb(null, safeName);
  }
});

const upload = multer({ storage });

module.exports = upload;