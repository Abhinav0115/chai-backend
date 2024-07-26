import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadToCloudinary = async (localFilePath) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    try {
        if (!localFilePath) return null;

        // Upload file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        // console.log("File uploaded successfully", response.url);

        // console.log("response", response);
        fs.unlinkSync(localFilePath); //remove the locally soved temporary file as the upload operation failed
        return response;
    } catch (error) {
        console.log("Error uploading file to cloudinary", error);
        fs.unlinkSync(localFilePath); //remove the locally soved temporary file as the upload operation failed
    }
};

export { uploadToCloudinary };
