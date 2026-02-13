import { bucket } from "../../core/config/bucket/gcs.js";
import { sendSuccessResponse } from "../response/responseHandler.js";
import { v4 as uuidv4 } from "uuid";

export const uploadImageToBucket = (req, res) =>{
 try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileExt = req.file.originalname.split(".").pop();
    const fileName = `images/${uuidv4()}.${fileExt}`;

    const file = bucket.file(fileName);

    const blobStream = file.createWriteStream({
      resumable: false,
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobStream.on("error", (err) => {
      res.status(500).json({ error: err.message });
    });

    blobStream.on("finish", async () => {
    const publicUrl = encodeURI(`https://storage.googleapis.com/${bucket.name}/${file.name}`);

      let data = {
        message: "File uploaded successfully",
        url: publicUrl,
      };

    return sendSuccessResponse(res, 200, data, "File uploaded successfully");
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.log("error while uploading image : ",error);
    res.status(500).json({ error: error.message });
  }
}