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

function start() {
    // Setup UI event listeners
    userInput.addEventListener("input", () => autoResizeTextarea(userInput));
    giftForm.addEventListener("submit", handleGiftRequest);
}

const systemPrompt = `You are the Gift Genie that can search the web! 

You generate gift ideas that feel thoughtful, specific, and genuinely useful.
Your output must be in structured Markdown.
Do not write introductions or conclusions.
Start directly with the gift suggestions.

Each gift must:
- Have a clear heading with the actual product's name
- Include a short explanation of why it works
- Include the current price or a price range
- Include one or more links to websites or social media business pages
where the gift can be bought

Prefer products that are widely available and well-reviewed.
If you can't find a working link, say so rather than guessing.

If the user mentions a location, situation, or constraint,
adapt the gift ideas and add another short section 
under each gift that guides the user to get the gift in that 
constrained context.

After the gift ideas, include a section titled "Questions for you"
with clarifying questions that would help improve the recommendations.

Finish with a section with H2 heading titled "Wanna browse yourself?"
with links to various ecommerce sites with relevant search queries and filters 
already applied.`;

async function handleGiftRequest(e) {
    // Prevent default form submission
    e.preventDefault();

    // Get user input, trim whitespace, exit if empty
    const userPrompt = userInput.value.trim();
    if (!userPrompt) return;

    // Set loading state (hides output, animates lamp)
    setLoading(true);
    outputContent.innerHTML = "";

    try {
        // Stream the Responses API so text can render as it arrives
        const stream = await openai.responses.create({
            model: process.env.AI_MODEL,
            input: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            tools: [{ type: "web_search_preview" }],
            stream: true,
        });

        let giftSuggestions = "";
        let hasShownOutput = false;

        for await (const event of stream) {
            if (event.type !== "response.output_text.delta") continue;

            giftSuggestions += event.delta;

            // Convert Markdown to HTML
            const html = marked.parse(giftSuggestions);

            // Sanitize the HTML to prevent XSS attacks
            const safeHTML = DOMPurify.sanitize(html);

            // Render the output
            outputContent.innerHTML = safeHTML;

            // Reveal the output on the first text chunk, while the lamp is still loading
            if (!hasShownOutput) {
                showStream();
                hasShownOutput = true;
            }
        }

        console.log(giftSuggestions);
    } catch (error) {
        // Log the error for debugging
        console.error(error);

        // Display friendly error message
        outputContent.textContent =
            "Sorry, I can't access what I need right now. Please try again in a bit.";
    } finally {
        // Always clear loading state (shows output, resets lamp)
        setLoading(false);
    }
}

start();
