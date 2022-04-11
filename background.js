let host = null;
let token = null;

chrome.storage.sync.get(['yaTrackerExtensionToken', 'yaTrackerExtensionHost'], (result) => {
    host = result.yaTrackerExtensionHost;
    token = result.yaTrackerExtensionToken;
    if (!token || !host){
        chrome.action.setBadgeText({text: '!'});
        chrome.action.setBadgeBackgroundColor({color: '#de9304'});
    }
});
