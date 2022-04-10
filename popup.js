chrome.storage.sync.get(['yaTrackerExtensionToken', 'yaTrackerExtensionHost'], (result) => {
    host = result.yaTrackerExtensionHost;
    token = result.yaTrackerExtensionToken;
    if (!token || !host){
        let host = document.getElementById("host");
    }
});

let loginBtn = document.getElementById("loginBtn");
let host = document.getElementById("host");
let accessToken = document.getElementById("accessToken");

loginBtn.addEventListener("click", async () => {
    chrome.storage.sync.set({yaTrackerExtensionHost: host.value});
    chrome.storage.sync.set({yaTrackerExtensionToken: accessToken.value});

    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tabs => {
        // ...and send a request for the DOM info...
        chrome.tabs.sendMessage(
            tabs[0].id,
            {from: 'yandex-tracker-popup', subject: 'tracker-extension', host:'123', token:'456'},
            // ...also specifying a callback to be called
            //    from the receiving end (content script).
            ()=>{
                console.log('a???');
            });
    });
});

    /*let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: setPageBackgroundColor,
    });*/


// The body of this function will be executed as a content script inside the
// current page
function setPageBackgroundColor() {
    console.log('AUTH !!!!');
    // Код для выполнения скрипта на странице сайта
    /*chrome.storage.sync.get("color", ({ color }) => {
        document.body.style.backgroundColor = color;
    });*/
}
