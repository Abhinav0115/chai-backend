import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(`${process.env.MONGO_URI}/${ DB_NAME }`);
    
        console.log(`MongoDB Connected!! DB_HOST: ${conn.connection.host}`);
    } catch (error) {
        console.error("MongoDB connection Error:" ,error);
        process.exit(1);
    }
}
    