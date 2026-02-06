import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../lib/db.js"; 
import { generateToken } from "../lib/utils.js";

const signup = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const userCheck = await query("SELECT * FROM users WHERE email = $1", [email]);
        // console.log("usercheck: ", userCheck);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ success:false, data: null,message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await query(
            "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
            [username, email, hashedPassword]
        );
        if(newUser.rowCount>0){
            generateToken(newUser.rows[0].id, res);
        }
        res.status(201).json({success:true, data: newUser.rows[0], message: "User created!", });

    } catch (err) {
        console.error("signup Error:", err);
        res.status(500).json({ success:false, data: null, message: "Server Error" });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        //Find User
        const result = await query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }else{
            // console.log(user);
            generateToken(user.id, res);
        }

        res.json({ 
            message: "Login successful", 
            user: { id: user.id, username: user.username, email: user.email } 
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

const logout = (req, res) => {
    // To logout, we just clear the cookie
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
};

const getProfile = async (req, res) => {
    // We can access req.userId because the middleware put it there!
    try {
        const user = await query("SELECT id, username, email FROM users WHERE id = $1", [req.userId]);
        console.log(user.rows);
        res.send({
            success:true,
            data:user.rows[0],
            message:"user profile fetched successfully."
        });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};

export {
    signup, login, logout, getProfile
}