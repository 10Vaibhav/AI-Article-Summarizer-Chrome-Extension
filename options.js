document.addEventListener("DOMContentLoaded", ()=> {
    chrome.storage.sync.get(["geminiApiKey"], ({geminiApiKey}) => {
        if(geminiApiKey) document.getElementById("api-key").value = geminiApiKey;
    });

    document.getElementById("save-button").addEventListener("click", ()=> {
        const apiKey = document.getElementById("api-key").value.trim();
        const saveBtn = document.getElementById("save-button");
        const successMsg = document.getElementById("success-message");

        if(!apiKey) {
            document.getElementById("api-key").focus();
            return;
        }

        saveBtn.disabled = true;

        chrome.storage.sync.set({geminiApiKey: apiKey}, ()=> {
            successMsg.classList.add("show");
            setTimeout(()=> {
                window.close();
            }, 1500);
        });
    });
});

