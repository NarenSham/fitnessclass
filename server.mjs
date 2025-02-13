import express from 'express';
import bodyParser from 'body-parser';
import { GoogleGenerativeAI } from "@google/generative-ai"; // Import the GoogleGenerativeAI class
import fetch from 'node-fetch'; // Import node-fetch
import dotenv from 'dotenv'; // Load environment variables from .env file

dotenv.config(); // Load environment variables

// Set fetch as a global function
global.fetch = fetch;

const app = express();
const port = 3000;

// ... existing code ... 

async function startServer() {
    const fetch = await import('node-fetch'); // Import node-fetch dynamically
    // ... existing code ...
}

startServer(); // Call the async function to start the server
// ... existing code ... 