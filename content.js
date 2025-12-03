function getArticleText(){
    // Try article tag first
    const article = document.querySelector("article");
    if(article && article.innerText.trim()) {
        return article.innerText.trim();
    }

    // Try main content area
    const main = document.querySelector("main");
    if(main && main.innerText.trim()) {
        return main.innerText.trim();
    }

    // Try common article selectors
    const selectors = [
        '[role="article"]',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.content'
    ];
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim()) {
            return element.innerText.trim();
        }
    }

    // Fallback: get all paragraphs
    const paragraphs = Array.from(document.querySelectorAll("p"));
    const text = paragraphs
        .map((p) => p.innerText.trim())
        .filter(t => t.length > 0)
        .join("\n");
    
    return text;
}

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
    if(req.type === "GET_ARTICLE_TEXT") {
        const text = getArticleText();
        sendResponse({ text });
        return true; // Keep the message channel open for async response
    }
});

