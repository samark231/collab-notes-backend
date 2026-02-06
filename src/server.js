import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { io, server, app } from "./lib/socket.js";
import createTables from './models/schema.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.use(express.json({limit:"10mb"}));
app.use(cookieParser());
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}));

//health-check
app.get("/", (req, res) => {
    res.send("API is running");
});

server.listen(PORT, async () => {
    console.log("Server started at port:", PORT);
    await createTables();
});