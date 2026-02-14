const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const API_KEY = process.env.GEMINI_API_KEY;

async function fetchWithRetry(url, options, retries = 5) {
    let delay = 1000;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            if (response.status !== 429 && response.status < 500) break;
        } catch (e) {
            console.error(`Attempt ${i + 1} failed:`, e);
        }
        if (i < retries - 1) {
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
        }
    }
    throw new Error("API call failed after retries.");
}

app.post('/api/recognize-character', async (req, res) => {
    try {
        if (!API_KEY) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        const { imageData } = req.body;
        if (!imageData) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        const body = {
            contents: [{
                role: "user",
                parts: [
                    { text: "Identify this single handwritten Chinese character. Return ONLY the character itself. If you cannot identify it, return '？'." },
                    { inlineData: { mimeType: "image/png", data: imageData } }
                ]
            }]
        };

        const data = await fetchWithRetry(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }
        );

        const char = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().charAt(0) || "？";
        res.json({ character: char });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to recognize character' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
