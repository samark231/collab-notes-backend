import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import { io, server, app } from "./lib/socket.js";
import createTables from './models/schema.js';
import authRoutes from "./routes/auth.routes.js";
import noteRoutes from "./routes/notes.routes.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.use(express.json({limit:"10mb"}));
app.use(cookieParser());
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}));

app.use("/api/auth", authRoutes); 
app.use("/api/notes", noteRoutes);

//health-check
app.get("/", (req, res) => {
    res.send("API is running");
});

server.listen(PORT, async () => {
    console.log("Server started at port:", PORT);
    await createTables();
});