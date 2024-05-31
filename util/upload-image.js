import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

//image 다루기
export const upload = multer({
  storage: multerS3({
    s3: client,
    bucket: process.env.AWS_S3_BUCKET,
    // acl: "public-read",
    key: (req, file, cb) => {
      const fileName =
        "/image/CARD/" +
        "_" +
        file.fieldname +
        "_" +
        file.originalname +
        Date.now();
      cb(null, fileName);
    }
  })
});
