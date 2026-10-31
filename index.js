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

// Initialize messages array with system prompt (context-sensitive)
// few-shots prompting
const messages = [
    {
        role: "system",
        content: `You are the Gift Genie!
      Make your gift suggestions thoughtful and practical.
      The user will describe the gift's recipient. 
      Your response must be in structured Markdown.
      Each gift must: 
        - Have a clear heading
        - A short explanation of why it would work
  
      If the user mentions a location or a time constraint,
      add another section under each gift that gives the user 
      a step by step guide on where and how they can get the gift.
  
      Skip intros and conclusions. 
      Only output gift suggestions.
      
      End with a section with an H2 heading titled "Questions for you" 
      that contains follow-ups that would help improve the 
      gift suggestions`,
    },
    {
        role: "user",
        content:
            "dubai airport. last minute gifts for niece (arts & crafts) and nephew who loves football",
    },
    {
        role: "assistant",
        content: `
  ### Travel Art Kit for Niece (Compact & Portable)
  
  A small, kid-friendly arts & crafts item that's easy to pack and perfect for a quick creative distraction during travel.
  
  **How to get it:**
  1. Head to Dubai International Airport (DXB) and proceed to Terminal 3 Departures.
  2. Visit Dubai Duty Free or a nearby WHSmith that carries kids’ stationery.
  3. Ask for compact arts & crafts kits or a coloring book with pencils.
  4. Choose a lightweight option suitable for carry-on.
  5. Request gift wrapping if available.
  
  ---
  
  ### Mini Football Keychain for Nephew
  
  A light, inexpensive football-themed souvenir that’s easy to carry and perfect for an airport purchase.
  
  **How to get it:**
  1. Visit Dubai Duty Free or a souvenir shop near the gates.
  2. Ask for football-themed keychains or small sports souvenirs.
  3. Check toy or sports sections if needed.
  4. Purchase and pack securely.
  
  ---
  
  ## Questions for you
  1. What are the ages of your niece and nephew?
  2. Do you have a budget per gift?
  3. Are you departing from Terminal 3?
  4. Does your nephew support a specific team?
  `,
    },
    {
        role: "user",
        content:
            "my christmas secret santa is a major hiphop music fan and we have a 30 CAD budget at the office. week left. I have Amazon prime.",
    },
    {
        role: "assistant",
        content: `
  ### Hip-Hop Coffee Table Book (Artists, Lyrics, or Culture)
  
  A well-designed book on hip-hop history, iconic albums, or legendary artists works as a tasteful office-friendly gift that still feels personal to a serious fan.
  
  **How to get it:**
  
  1. Open Amazon and make sure you’re on Amazon.ca.
  2. Search for titles like *“hip hop coffee table book”*, *“hip hop history book”*, or *“rap album art book”*.
  3. Filter by **Prime eligible** and price under **30 CAD**.
  4. Check delivery date to ensure arrival within a week.
  5. Order hardcover if available for a more premium feel.
  
  ---
  
  ### Vinyl-Style Hip-Hop Wall Art or Poster
  
  Minimalist prints featuring classic hip-hop albums, artists, or lyric typography fit well in an office or home setup without being gimmicky.
  
  **How to get it:**
  
  1. Search Amazon for *“hip hop wall art”* or *“rap album poster minimalist”*.
  2. Filter by **Prime** and size (A3 or smaller is safer for offices).
  3. Read reviews to ensure print quality.
  4. Order unframed to stay within budget, or framed if still under 30 CAD.
  5. Consider neutral designs if office taste is conservative.
  
  ---
  
  ### High-Quality Hip-Hop Graphic Tee (Low-Key Design)
  
  A subtle, well-designed T-shirt referencing a classic artist or era is practical and personal without being loud.
  
  **How to get it:**
  
  1. Search *“hip hop graphic t shirt”* or specific artists (e.g., Nas, Wu-Tang, Kendrick).
  2. Filter by **Prime** and check size availability.
  3. Look for neutral colors (black, grey, off-white).
  4. Check material and reviews for print durability.
  5. Order one size up if unsure.
  
  ---
  
  ### Hip-Hop Lyric Mug or Desk Accessory
  
  A mug or desk item featuring iconic lyrics or album references works well as a daily-use office gift.
  
  **How to get it:**
  
  1. Search *“hip hop lyric mug”* or *“rap quote mug”* on Amazon.
  2. Filter Prime-only and check delivery date.
  3. Avoid novelty fonts; choose clean typography.
  4. Ensure it’s dishwasher-safe from the product details.
  5. Order with protective packaging enabled.
  
  ---
  
  ### Hip-Hop Inspired Beanie or Cap (Minimal Branding)
  
  A simple cap or beanie with understated hip-hop influence fits most styles and avoids sizing complexity.
  
  **How to get it:**
  
  1. Search *“hip hop cap minimalist”* or *“streetwear beanie”*.
  2. Filter Prime and price under 30 CAD.
  3. Choose adjustable caps or one-size beanies.
  4. Check reviews for fit and fabric quality.
  5. Order neutral colors to keep it versatile.
  
  ---
  
  ## Questions for you
  
  1. Do you know their favorite hip-hop era (90s, 2000s, modern)?
  2. Any specific artists they constantly mention?
  3. Is this a conservative office environment or casual?
  4. Would you prefer something decorative or something they can use daily?
  `,
    },
];

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
        // Enable streaming in the chat completions request
        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            stream: true,
            // temperature: 0 // 0 is the most deterministic, 1 is the most creative
            // top_p: 1 // all possible tokens are considered
        });

        // Show output container immediately for streaming feedback
        showStream();

        // Accumulate the streamed response
        let giftSuggestions = "";

        // Iterate over streamed chunks as they arrive
        for await (const chunk of stream) {
            const chunkContent = chunk.choices[0]?.delta?.content;
            if (!chunkContent) continue;

            // Append to accumulated response
            giftSuggestions += chunkContent;

            // Convert Markdown to HTML progressively
            const html = marked.parse(giftSuggestions);

            // Sanitize the HTML to prevent XSS attacks
            const safeHTML = DOMPurify.sanitize(html);

            // Render progressively
            outputContent.innerHTML = safeHTML;
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
