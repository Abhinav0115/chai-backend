import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

//Routes import
import indexRoutes from "./routes/index.routes.js";

const app = express();


// Enable CORS
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

// Parse JSON bodies (as sent by API clients)
app.use(express.json());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));
// Serve static files
app.use(express.static("public"));

// Cookie parser
app.use(cookieParser());

//Routes
app.use("/api/v1", indexRoutes);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

export default app;
