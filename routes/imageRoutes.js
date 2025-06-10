const express = require('express');
const { multerUploads } = require('../middleware/upload');
const { uploadImage } = require('../controllers/uploadController');
const router = express.Router()


router.post("/upload", multerUploads, uploadImage)


module.exports = router;