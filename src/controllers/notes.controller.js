import { query } from "../lib/db.js";


const createNote = async (req, res) => {
    const { title, content } = req.body;

    try {
        //a note can only have one owner
        const result = await query(
            "INSERT INTO notes (title, content, owner_id) VALUES ($1, $2, $3) RETURNING *",
            [title, content, req.userId]
        );

        res.status(201).send({success:true, data:result.rows[0], message:"note created successfully"});
    } catch (err) {
        console.error(err);
        res.status(500).json({ success:false, data:null,message: "Server Error" });
    }
};

const getNotes = async (req, res) => {
    try {
        
        const sql = `
            SELECT DISTINCT n.* FROM notes n
            LEFT JOIN collaborators c ON n.id = c.note_id
            WHERE n.owner_id = $1 OR c.user_id = $1
            ORDER BY n.updated_at DESC
        `;

        const result = await query(sql, [req.userId]);
       res.status(200).send({success:true, data:result.rows, message:"note created successfully"});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

const getNoteById = async (req, res) => {
    const { id } = req.params;

    try {
        const noteResult = await query("SELECT * FROM notes WHERE id = $1", [id]);
        const note = noteResult.rows[0];

        if (!note) return res.status(404).json({ message: "Note not found" });

        const collabResult = await query(
            "SELECT * FROM collaborators WHERE note_id = $1 AND user_id = $2", 
            [id, req.userId]
        );

        const isOwner = note.owner_id === req.userId;
        const isCollaborator = collabResult.rows.length > 0;

        if (!isOwner && !isCollaborator) {
            return res.status(403).json({ message: "Access Denied" });
        }

        res.json(note);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

const updateNote = async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    try {
        const noteResult = await query("SELECT * FROM notes WHERE id = $1", [id]);
        const note = noteResult.rows[0];

        if (!note) return res.status(404).json({ message: "Note not found" });

        const isOwner = note.owner_id === req.userId;
        
        const collabResult = await query(
            "SELECT role FROM collaborators WHERE note_id = $1 AND user_id = $2", 
            [id, req.userId]
        );
        const isEditor = collabResult.rows.length > 0 && collabResult.rows[0].role === 'EDITOR';

        if (!isOwner && !isEditor) {
            return res.status(403).json({ message: "You do not have permission to edit this note" });
        }

        const updateResult = await query(
            `UPDATE notes 
             SET title = COALESCE($1, title), 
                 content = COALESCE($2, content), 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3 
             RETURNING *`,
            [title, content, id]
        );

        res.json(updateResult.rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

const deleteNote = async (req, res) => {
    const { id } = req.params;

    try {
        const noteResult = await query("SELECT * FROM notes WHERE id = $1", [id]);
        const note = noteResult.rows[0];

        if (!note) return res.status(404).json({ message: "Note not found" });

        if (note.owner_id !== req.userId) {
            return res.status(403).json({ message: "Only the owner can delete this note" });
        }

        await query("DELETE FROM notes WHERE id = $1", [id]);
        res.json({ message: "Note deleted successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

export{
    createNote, getNoteById, getNotes, updateNote, deleteNote
}