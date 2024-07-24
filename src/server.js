import express from 'express';
import { connectDB } from './db/connectDB.js';
import dotenv from 'dotenv';

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;


connectDB();

app.on("error", (error) => {
    console.log(`App Error: ${error.message}`);
    process.exit(1);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})