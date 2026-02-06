import express from "express";
import { createNote, getNotes, getNoteById, updateNote, deleteNote, addCollaborator } from "../controllers/notes.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createNote);       
router.get("/", getNotes);          
router.get("/:id", getNoteById);    
router.put("/:id", updateNote);    
router.delete("/:id", deleteNote); 
router.post("/:id/collaborators", addCollaborator);

export default router;