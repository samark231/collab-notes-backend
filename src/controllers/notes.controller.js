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
            SELECT n.*, 
                CASE 
                    WHEN n.owner_id = $1 THEN 'OWNER'
                    ELSE c.role 
                END AS access_role 
            FROM notes n
            LEFT JOIN collaborators c ON n.id = c.note_id AND c.user_id = $1
            WHERE n.owner_id = $1 OR c.user_id = $1
            ORDER BY n.updated_at DESC
        `;

        const result = await query(sql, [req.userId]);
       res.status(200).send({success:true, data:result.rows, message:"note created successfully"});
    } catch (err) {
        console.error(err);
        res.status(500).json({success:false, data:null, message: "Server Error" });
    }
};

const getNoteById = async (req, res) => {
    const { id } = req.params;

    try {
        const noteResult = await query("SELECT * FROM notes WHERE id = $1", [id]);
        const note = noteResult.rows[0];

        if (!note) return res.status(404).json({ message: "Note not found" });

        // Check Collab status
        const collabResult = await query(
            "SELECT role FROM collaborators WHERE note_id = $1 AND user_id = $2", 
            [id, req.userId]
        );

        const isOwner = note.owner_id === req.userId;
        const isCollaborator = collabResult.rows.length > 0;

        if (!isOwner && !isCollaborator) {
            return res.status(403).json({ message: "Access Denied" });
        }

        let role = 'VIEWER';
        if (isOwner) role = 'OWNER';
        else if (isCollaborator) role = collabResult.rows[0].role;
        
        // Attach the role to the note object
        const noteWithRole = { ...note, access_role: role };

        res.json({success:true, data: noteWithRole, message:"Note fetched"});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};
const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;

        const noteResult = await query("SELECT * FROM notes WHERE id = $1", [id]);
        const note = noteResult.rows[0];

        if (!note) return res.status(404).json({ success:false, data:null, message: "Note not found" });

        const isOwner = note.owner_id === req.userId;
        
        const collabResult = await query(
            "SELECT role FROM collaborators WHERE note_id = $1 AND user_id = $2", 
            [id, req.userId]
        );
        
        const isEditor = collabResult.rows.length > 0 && collabResult.rows[0].role === 'EDITOR';

        if (!isOwner && !isEditor) {
            return res.status(403).json({ success:false, data:null, message: "You do not have permission to edit this note" });
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

        let role = 'VIEWER'; 
        if (isOwner) role = 'OWNER';
        else if (isEditor) role = 'EDITOR';
        const finalNote = { 
            ...updateResult.rows[0], 
            access_role: role 
        };

        res.json({ success:true, data: finalNote, message: "Note updated successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success:false, data:null, message: "Server Error" });
    }
};
const deleteNote = async (req, res) => {
    const { id } = req.params;

    try {
        const noteResult = await query("SELECT * FROM notes WHERE id = $1", [id]);
        const note = noteResult.rows[0];

        if (!note) return res.status(404).json({ success:false, data:null,message: "Note not found" });

        if (note.owner_id !== req.userId) {
            return res.status(403).json({success:false, data:null, message: "Only the owner can delete this note" });
        }

        await query("DELETE FROM notes WHERE id = $1", [id]);
        res.json({success:true, data:null, message: "Note deleted successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success:false, data:null,message: "Server Error" });
    }
};

const addCollaborator = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, role } = req.body;
        const noteResult = await query("SELECT owner_id FROM notes WHERE id = $1", [id]);
        
        if (noteResult.rows.length === 0) {
            return res.status(404).json({ success:false, data:null,message: "Note not found" });
        }

        if (noteResult.rows[0].owner_id !== req.userId) {
            return res.status(403).json({success:false, data:null, message: "Only the owner can add collaborators" });
        }

        const userResult = await query("SELECT id FROM users WHERE email = $1", [email]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({success:false, data:null, message: "User with this email does not exist" });
        }

        const targetUserId = userResult.rows[0].id;
        if (targetUserId === req.userId) {
            return res.status(400).json({ success:false, data:null, message: "You are already the owner!" });
        }
        const newCollab = await query(
            `INSERT INTO collaborators (note_id, user_id, role) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [id, targetUserId, role]
        );

        res.status(201).json({
            success: true, 
            message: "Collaborator added successfully",
            data: newCollab.rows[0]
        });

    } catch (err) {
        if (err.code === '23505') { 
            return res.status(400).json({ message: "User is already a collaborator" });
        }
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

export{
    createNote, getNoteById, getNotes, updateNote, deleteNote, addCollaborator
}