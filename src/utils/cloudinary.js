import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_URL = process.env.CLOUDINARY_URL;

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (
    localFilePath
    // , folder
) => {
    try {
        if (!localFilePath) return null;

        // Upload file to cloudinary
        const response = await cloudinary.uploader.upload(
            localFilePath,
            {
                // folder: folder,
                resource_type: "auto",
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary upload error: ", error);
                    return null;
                }
                return result;
            }
        );

        console.log("File uploaded successfully", response.url);

        return response.url;
    } catch (error) {
        fs.unlinkSync(localFilePath); //remove the locally soved temporary file as the upload operation failed
    }
};

export { uploadToCloudinary };
