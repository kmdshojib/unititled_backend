import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
    cloud_name: process.env.cloud_NAME,
    api_key: process.env.cloud_API_KEY,
    api_secret: process.env.cloud_API_SECRET // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloud = async (filePath) => {
    try {
        if (!filePath) {
            return "Couldn't find path!"
        }
        const res = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto"
        })
        // file has successfully been uploaded
        // console.log("File successfully uploaded to Cloudinary!", res.url)
        fs.unlinkSync(filePath);
        return res;
    } catch (err) {
        fs.unlink(filePath); // removes the locally uploaded file
        return null;
    }
}

export { uploadOnCloud }