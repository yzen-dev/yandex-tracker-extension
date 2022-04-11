let mainPageBlock = document.getElementById("mainPage");
let integrationConnectedBlock = document.getElementById("integrationConnectedBlock");
let integrationDisconnectBlock = document.getElementById("integrationDisconnectBlock");
let gitlabLoginForm = document.getElementById("gitlabLoginForm");
let integrationTrashBtn = document.getElementById("integrationTrash");
let integrationConnectBtn = document.getElementById("integrationConnect");
let loginBtn = document.getElementById("loginBtn");

chrome.storage.sync.get(['yaTrackerExtensionToken', 'yaTrackerExtensionHost'], (result) => {
    host = result.yaTrackerExtensionHost;
    token = result.yaTrackerExtensionToken;
    if (token && host){
        integrationConnectedBlock.classList.remove('visible-hidden');
    } else {
        integrationDisconnectBlock.classList.remove('visible-hidden');
        //gitlabLoginForm.classList.remove('visible-hidden');
    }
});

loginBtn.addEventListener("click", async () => {
    let host = document.getElementById("host");
    let accessToken = document.getElementById("accessToken");

    mainPageBlock.classList.remove('visible-hidden');
    gitlabLoginForm.classList.add('visible-hidden');

    chrome.storage.sync.set({yaTrackerExtensionHost: host.value});
    chrome.storage.sync.set({yaTrackerExtensionToken: accessToken.value});

    chrome.action.setBadgeText({text: ''});
    chrome.action.setBadgeBackgroundColor({color: ''});

    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {from: 'yandex-tracker-popup', subject: 'tracker-extension', method:'auth'},);
    });
});

integrationConnectBtn.addEventListener("click", async () => {
    mainPageBlock.classList.add('visible-hidden');
    gitlabLoginForm.classList.remove('visible-hidden');
})

integrationTrashBtn.addEventListener("click", async () => {
    refreshGitlabData()
})

function refreshGitlabData(){
    chrome.storage.sync.set({yaTrackerExtensionHost: null});
    chrome.storage.sync.set({yaTrackerExtensionToken: null});
    chrome.action.setBadgeText({text: '!'});
    chrome.action.setBadgeBackgroundColor({color: '#de9304'});
    integrationConnectedBlock.classList.add('visible-hidden');
    integrationDisconnectBlock.classList.remove('visible-hidden');
}
