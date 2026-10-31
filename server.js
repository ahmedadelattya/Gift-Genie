import express from "express";
import OpenAI from "openai";
import { loadEnvFile } from "node:process";

loadEnvFile();

const app = express();
app.use(express.json());

// Initialize an OpenAI client for your provider using env vars
const openai = new OpenAI({
    apiKey: process.env.AI_KEY,
    baseURL: process.env.AI_URL,
});

// Initialize messages array with system prompt
const messages = [
    {
        role: "system",
        content: `You are the Gift Genie. 

You generate gift ideas that feel thoughtful, specific, and genuinely useful.
Your output must be in structured Markdown.
Do not write introductions or conclusions.
Start directly with the gift suggestions.

Each gift must:
- Have a clear heading
- Include a short explanation of why it works

If the user mentions a location, situation, or constraint,
adapt the gift ideas and add another short section 
under each gift that guides the user to get the gift in that 
constrained context.

After the gift ideas, include a section titled "Questions for you"
with clarifying questions that would help improve the recommendations.`,
    },
];

app.post("/api/gift", async (req, res) => {
    const { userPrompt } = req.body;

    messages.push({
        role: "user",
        content: userPrompt,
    });

    try {
        const stream = await openai.chat.completions.create({
            model: process.env.AI_MODEL,
            messages,
            stream: true,
            reasoning_effort: "minimal",
        });

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders();

        let giftSuggestions = "";

        for await (const chunk of stream) {
            const chunkContent = chunk.choices[0]?.delta?.content || "";
            if (!chunkContent) continue;

            giftSuggestions += chunkContent;
            res.write(chunkContent);
        }

        console.log(giftSuggestions);
        res.end();
    } catch (e) {
        console.error(e);
        if (!res.headersSent) {
            res.status(500).json({
                message: `It's not you, it's us. 
    Something went wrong on the server`,
            });
        } else {
            res.end();
        }
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
