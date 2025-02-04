const AWS = require("aws-sdk");
const busboy = require("busboy");

// Initialize S3 client with environment variables
const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
});

const parseImages = (event) => {
  return new Promise((resolve, reject) => {
    const busboyInstance = busboy({ headers: event.headers });
    const images = [];

    busboyInstance.on("file", (fieldname, fileStream, filename, encoding) => {
      const mimeType = filename.mimeType;

      console.log("File event triggered", { fieldname, filename, mimeType });

      if (!mimeType) {
        return reject(new Error(`No mimeType provided for the uploaded file.`));
      }

      if (!mimeType.startsWith("image/")) {
        return reject(
          new Error(
            `Invalid file type for ${filename.filename}. Only image files are allowed.`
          )
        );
      }

      const chunks = [];
      fileStream.on("data", (chunk) => chunks.push(chunk));
      fileStream.on("end", () => {
        images.push({
          filename: filename.filename,
          content: Buffer.concat(chunks),
          mimeType,
        });
      });
    });

    busboyInstance.on("finish", () => resolve(images));
    busboyInstance.on("error", (error) => {
      console.error("Error parsing multipart data:", error);
      reject(new Error("Error parsing the file data."));
    });

    busboyInstance.end(
      Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf-8")
    );
  });
};

const uploadImageToS3 = async (image, bucketName, keyPrefix) => {
  const key = `${keyPrefix}/${Date.now()}_${image.filename}`;
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: image.content,
    ContentType: image.mimeType,
  };

  try {
    const result = await s3.upload(params).promise();
    console.log(`Successfully uploaded image: ${image.filename}`);
    return { imageUrl: result.Location, filename: image.filename };
  } catch (error) {
    console.error("Error uploading image to S3:", error);
    throw new Error(`Failed to upload image ${image.filename} to S3.`);
  }
};

module.exports = { parseImages, uploadImageToS3 };
