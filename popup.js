document.getElementById("summarize").addEventListener("click", () => {
    const resultDiv = document.getElementById("result");
    const summaryType = document.getElementById("summary-type").value;
    const summarizeBtn = document.getElementById("summarize");

    resultDiv.className = '';
    resultDiv.innerHTML = '<div class="loading"><div class="loader"></div><div class="loading-text">Generating summary...</div></div>';
    summarizeBtn.disabled = true;

    // 1. Get the user's API Key
    chrome.storage.sync.get(["geminiApiKey"], ({geminiApiKey}) => {
        if (!geminiApiKey) {
            resultDiv.className = 'error';
            resultDiv.textContent = "⚠️ No API Key Set. Please configure your API key in the extension settings.";
            summarizeBtn.disabled = false;
            return;
        }

        // 2. Ask content.js for the page text
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            chrome.tabs.sendMessage(tab.id, { type: "GET_ARTICLE_TEXT" }, async (response) => {
                
                // Check for connection errors
                if (chrome.runtime.lastError) {
                    resultDiv.className = 'error';
                    resultDiv.textContent = "⚠️ Cannot summarize this page. Try reloading the page or use on a regular webpage (not chrome:// pages).";
                    summarizeBtn.disabled = false;
                    return;
                }
                
                if(!response || !response.text) {
                    resultDiv.className = 'error';
                    resultDiv.textContent = "⚠️ Couldn't extract text from this page.";
                    summarizeBtn.disabled = false;
                    return;
                }
                // Send text to Gemini
                try {
                    const summary = await getGeminiSummary(response.text, summaryType, geminiApiKey);
                    resultDiv.className = '';
                    resultDiv.textContent = summary;
                } catch (error) {
                    resultDiv.className = 'error';
                    resultDiv.textContent = "⚠️ Gemini error: " + error.message; 
                } finally {
                    summarizeBtn.disabled = false;
                }
            });
        });
    });
});

async function getGeminiSummary(text, summaryType, apiKey) {

  const maxLength = 20000;
  const truncatedText =
    text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

  let prompt;
  switch (summaryType) {
    case "brief":
      prompt = `Provide a brief summary of the following article in 2-3 sentences:\n\n${truncatedText}`;
      break;
    case "detailed":
      prompt = `Provide a detailed summary of the following article, covering all main points and key details:\n\n${truncatedText}`;
      break;
    case "bullets":
      prompt = `Summarize the following article in 5-7 key points. Format each point as a line starting with "- " (dash followed by a space). Do not use asterisks or other bullet symbols, only use the dash. Keep each point concise and focused on a single key insight from the article:\n\n${truncatedText}`;
      break;
    default:
      prompt = `Summarize the following article:\n\n${truncatedText}`;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error?.message || "API request failed");
    }

    const data = await res.json();
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No summary available."
    );
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate summary. Please try again later.");
  }
}

document.getElementById("copy-btn").addEventListener("click", () => {
  const txt = document.getElementById("result").innerText;
  if(!txt || txt.includes('Select a summary type')) return;

  navigator.clipboard.writeText(txt).then(()=> {
    const btn = document.getElementById("copy-btn");
    const icon = document.getElementById("copy-icon");
    const text = document.getElementById("copy-text");
    
    btn.classList.add('copied');
    icon.textContent = "✓";
    text.textContent = "Copied!";
    
    setTimeout(()=> {
      btn.classList.remove('copied');
      icon.textContent = "📋";
      text.textContent = "Copy";
    }, 2000);
  });
});

