const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

aws.config.update({
  secretAccessKey: 'YAzzCVodzw4LZwzKQK/4Z53iGzxfSspiwFpzdmcM',
  accessKeyId: 'AKIA5X6ODKSBGB7MQF5D',
  region: 'us-east-1'
});

const s3 = new aws.S3();


const upload = multer({
  storage: multerS3({
    acl: 'public-read',
    s3,
    bucket: 'gau0202',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: 'TESTING_METADATA' });
    },
    key: function (req, file, cb) {
      var fileName = file.originalname.toLowerCase();
      cb(null, Date.now().toString() + fileName)
    }
  })
});

module.exports = upload;