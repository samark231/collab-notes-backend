import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"],
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // 1. Join a specific Note Room
    socket.on("join_note", (noteId) => {
        if (!noteId) return;
        socket.join(`note_${noteId}`);
        console.log(`User ${socket.id} joined room: note_${noteId}`);
    });

    // 2. Leave a Note Room
    socket.on("leave_note", (noteId) => {
        if (!noteId) return;
        socket.leave(`note_${noteId}`);
        console.log(`User ${socket.id} left room: note_${noteId}`);
    });

    // 3. Handle Updates (The "Broadcast")
    // data = { noteId, content, title }
    socket.on("send_update", (data) => {
        const { noteId, content, title } = data;
        
        // Broadcast to everyone in the room EXCEPT the sender
        socket.to(`note_${noteId}`).emit("receive_update", { 
            content, 
            title 
        });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

export { io, app, server };