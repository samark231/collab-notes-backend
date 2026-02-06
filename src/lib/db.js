import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Add SSL for production
    ssl: process.env.NODE_ENV === "production" 
        ? { rejectUnauthorized: false } 
        : false 
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Error acquiring client', err.stack);
    } else {
        console.log('Connected to Database successfully');
    }
    if (release) release();
});

export const query = (text, params) => pool.query(text, params);