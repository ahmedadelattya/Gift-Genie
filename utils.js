/**
 * Auto-resize textarea to fit content
 */
export function autoResizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

/**
 * Toggle loading state for the request lifecycle.
 * When entering loading state: resets textarea, hides output, animates lamp.
 * When exiting: restores lamp to compact state.
 */
export function setLoading(isLoading) {
  const lampButton = document.getElementById("lamp-button");
  const lampText = document.querySelector(".lamp-text");
  const userInput = document.getElementById("user-input");
  const outputContainer = document.getElementById("output-container");

  lampButton.disabled = isLoading;

  if (isLoading) {
    // Reset textarea and hide previous output
    userInput.style.height = "auto";
    outputContainer.classList.add("hidden");
    outputContainer.classList.remove("visible");

    // Animate lamp
    lampButton.classList.remove("compact");
    lampButton.classList.add("loading");
    lampText.textContent = "Summoning Gift Ideas...";
  } else {
    // Restore lamp to compact state
    outputContainer.classList.remove("hidden");
    outputContainer.classList.add("visible");
    lampButton.classList.remove("loading");
    lampButton.classList.add("compact");
    lampText.textContent = "Rub the Lamp";
  }
}

export function checkEnvironment() {
  if (!process.env.AI_URL) {
    throw new Error("Missing AI_URL. This tells us which AI provider you're using.");
  }

  if (!process.env.AI_MODEL) {
    throw new Error("Missing AI_MODEL. The AI request needs a model name.");
  }

  if (!process.env.AI_KEY) {
    throw new Error("Missing AI_KEY. Your API key is not being picked up.");
  }

  console.log("AI provider URL:", process.env.AI_URL);
  console.log("AI model:", process.env.AI_MODEL);
}
