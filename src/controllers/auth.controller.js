import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../lib/db.js"; 
import { generateToken } from "../lib/utils.js";

const signup = async (req, res) => {
    const { firstName, lastName, username, email, password } = req.body;

    try {
        const userCheck = await query("SELECT * FROM users WHERE email = $1", [email]);
        // console.log("usercheck: ", userCheck);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ success:false, data: null,message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await query(
            "INSERT INTO users (firstName, lastName, username, email, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id,firstName, lastName, username, email",
            [firstName, lastName, username, email, hashedPassword]
        );
        if(newUser.rowCount>0){
           res.status(201).json({success:true, data: newUser.rows[0], message: "User created!", });
        }
        
    } catch (err) {
        console.error("signup Error:", err);
        res.status(500).json({ success:false, data: null, message: "Server Error" });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log("trying to log in user with email: ", email);
        const result = await query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];
        // console.log(user);
        if (!user) {
            return res.status(400).json({success:false, data:null, message: "Invalid credentials" });
        }

        // Check Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({success:false, data:null, message: "Invalid credentials" });
        }else{
            // console.log(user);
            generateToken(user.id, res);
        }
        const payload = { id: user.id, username: user.username, email: user.email, firstName:user.firstname, lastName:user.lastname };
        // console.log(payload);
        res.status(200).json({ 
            success:true,
            message: "Login successful", 
            data: payload
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({success:false, data:null, message: "Server Error" });
    }
};

const logout = (req, res) => {
    // To logout, we just clear the cookie
    res.clearCookie("jwt");
    res.json({ success:true, data: null, message: "Logged out successfully" });
};

const getProfile = async (req, res) => {
    // We can access req.userId because the middleware put it there!
    try {
        const users = await query("SELECT id, username, email,firstname,lastname FROM users WHERE id = $1", [req.userId]);
        const user = users.rows[0];
        const payload = { id: user.id, username: user.username, email: user.email, firstName:user.firstname, lastName:user.lastname };
        // console.log(payload);
        res.send({
            success:true,
            data:payload,
            message:"user profile fetched successfully."
        });
    } catch (err) {
        res.status(500).json({success:false, data:null, message: "Server Error" });
    }
};

export {
    signup, login, logout, getProfile
}