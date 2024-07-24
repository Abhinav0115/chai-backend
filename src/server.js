
import { connectDB } from './db/connectDB.js';
import dotenv from 'dotenv';

import app from './app.js';

dotenv.config();



const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Mongodb connection failed!!: ", error);
    process.exit(1);
});

