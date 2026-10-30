import OpenAI from "openai";
import { marked } from "marked";
import DOMPurify from "dompurify";
import {
    checkEnvironment,
    autoResizeTextarea,
    setLoading,
    showStream,
} from "./utils.js";

checkEnvironment();

// Initialize an OpenAI client for your provider using env vars
const openai = new OpenAI({
    apiKey: process.env.AI_KEY,
    baseURL: process.env.AI_URL,
    dangerouslyAllowBrowser: true,
});

// Get UI elements
const giftForm = document.getElementById("gift-form");
const userInput = document.getElementById("user-input");
const outputContent = document.getElementById("output-content");

// Initialize messages array with system prompt
const messages = [
    {
        role: "system",
        content: `You are the Gift Genie!
    Make your gift suggestions thoughtful and practical.
    The user will describe the gift's recipient. 
    Your response must be 1000 words. 
    Skip intros and conclusions. 
    Only output gift suggestions.`,
    },
];

function start() {
    // Setup UI event listeners
    userInput.addEventListener("input", () => autoResizeTextarea(userInput));
    giftForm.addEventListener("submit", handleGiftRequest);
}

async function handleGiftRequest(e) {
    // Prevent default form submission
    e.preventDefault();

    // Get user input, trim whitespace, exit if empty
    const userPrompt = userInput.value.trim();
    if (!userPrompt) return;

    // Set loading state (hides output, animates lamp)
    setLoading(true);

    // Add user message to global messages array
    messages.push({ role: "user", content: userPrompt });

    try {
        // Send a chat completions request and await its response
        const stream = await openai.chat.completions.create({
            model: process.env.AI_MODEL,
            messages,
            stream: true,
        });

        let giftSuggestions = "";

        // Show output container immediately for streaming feedback
        showStream();

        for await (const chunk of stream) {
            const chunkContent = chunk.choices[0].delta.content;
            giftSuggestions += chunkContent;

            // Convert Markdown to HTML
            const html = marked.parse(giftSuggestions);

            // Sanitize the HTML
            const safeHTML = DOMPurify.sanitize(html);

            // Display the sanitized HTML
            outputContent.innerHTML = safeHTML;
        }

        // Extract gift suggestions from the assistant message's content
        // const giftSuggestions = response.choices[0].message.content;
        console.log(giftSuggestions);
    } catch (err) {
        // Log the error for debugging
        console.error(err);

        // Display friendly error message
        outputContent.textContent =
            "Sorry, I can't access what I need right now. Please try again in a bit.";
    } finally {
        // Always clear loading state (shows output, resets lamp)
        setLoading(false);
    }
}

start();
