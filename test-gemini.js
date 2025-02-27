const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const fetch = require('node-fetch');
const { Headers } = require('node-fetch');

// Make fetch and Headers available globally
global.fetch = fetch;
global.Headers = Headers;

async function testGeminiModel() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Try different model names
        const modelNames = [
            "gemini-pro",
            "gemini-1.0-pro",
            "gemini-1.5-pro",
            "gemini-pro-vision"
        ];

        for (const modelName of modelNames) {
            try {
                console.log(`Testing model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                
                // Try a simple prompt
                const result = await model.generateContent('Say "Hello"');
                const response = await result.response;
                const text = response.text();
                console.log(`Success with ${modelName}:`, text);
            } catch (modelError) {
                console.log(`Failed with ${modelName}:`, modelError.message);
            }
        }
    } catch (error) {
        console.error('Error testing models:', error);
    }
}

// Run the function
testGeminiModel(); 