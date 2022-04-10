const svgClosedEye = '<svg viewBox="0 0 24 24" width="24" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'
const svgOpenEye = '<svg viewBox="0 0 24 24" width="24" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'

let host = null;
let token = null;

// Listen for messages from the popup.
chrome.runtime.onMessage.addListener((msg, sender, response) => {
    console.log('get message');
    console.log(msg);
    if ((msg.from === 'yandex-tracker-popup') && (msg.subject === 'tracker-extension')) {
        loadGitLabData();
    }
    return true;
});

window.onload = function () {
    loadGitLabData()
};


function loadGitLabData() {
    console.log('loadGitLabData');
    chrome.storage.sync.get(['yaTrackerExtensionToken', 'yaTrackerExtensionHost'], (result) => {
        console.log(result);
        host = result.yaTrackerExtensionHost;
        token = result.yaTrackerExtensionToken;
        if(host && token){
            checkSession();
        }
    });
}

function checkSession() {
    if (token || host) {
        initTrackerExtension()
    } else {
        console.log('empty gitlab auth');
    }
}


function initTrackerExtension() {
    console.log('Init extension');
    if (/BASE-/.test(document.location.pathname)) {
        console.log('Task find');
        updateCheckList();
        renderGitlabBlock();
    } else {
        console.log('task not found');
    }
}

function updateCheckList() {
    let showCompletedTask = true;
    const head = document.getElementsByClassName('Checklist-Header')[0];
    if (!head) return

    head.innerHTML +=
        '<button id="hideCompletedTaskBtn" type="button" class="Button2 Button2_size_s Button2_theme_clear" title="Скрыть выполненные задачи">' +
        '<span id="hideCompletedTaskIcon" class="Button2-Icon Icon" style="vertical-align: middle; height: 20px">' +
        svgClosedEye +
        '</span>' +
        '</button>'
    setTimeout(() => {
        document.getElementById('hideCompletedTaskBtn').onclick = () => {
            showCompletedTask = !showCompletedTask;
            document.getElementById('hideCompletedTaskIcon').innerHTML = showCompletedTask ? svgClosedEye : svgOpenEye;

            const elements = document.getElementsByClassName('ChecklistItem_checked');
            if (!elements) return;

            for (let element of elements) {
                element.style.display = element.style.display === 'none' ? 'flex' : 'none';
            }
        };
    }, 500)
}

async function renderGitlabBlock() {
    console.log('renderGitlabBlock');
    let matches = document.location.pathname.match(/BASE-(\d*)/)
    const taskId = matches[1];
    let mergeRequestData = null;
    await searchMergeRequest(taskId)
        .then(result => {
            mergeRequestData = result;
            console.log(result);
        })
        .catch(error => {
            console.log(error);
        });
    console.log(mergeRequestData);
    if (!mergeRequestData) {
        return;
    }

    const ticketCard = document.getElementsByClassName('b-ticket__main')[0];
    if (!ticketCard) return

    mergeRequestData.forEach(async MR => {
        //ticketCard.innerHTML += JSON.stringify(MR)
        ticketCard.innerHTML += getMergeRequestHtmlComponent(MR)

        await searchCommitsByMergeRequestId(MR.iid)
            .then(result => {
                console.log('commits');
                console.log(result);
                ticketCard.innerHTML += getCommitsHtmlComponent(result);
            })
            .catch(error => {
                console.warn('commits');
                console.warn(error);
            });
        let pipeline = null;
        await getPipelinesByMergeRequestId(MR.iid)
            .then(result => {
                console.log('getPipelinesByMergeRequestId');
                console.log(result);
                pipeline = result[0];
            })
            .catch(error => {
                console.warn('getPipelinesByMergeRequestId');
                console.warn(error);
            });
        if (pipeline) {
            await getPipelinesTestReport(pipeline.id)
                .then(result => {
                    console.log('getPipelinesTestReport');
                    console.log(result);
                })
                .catch(error => {
                    console.warn('getPipelinesTestReport');
                    console.warn(error);
                });
        }
    })

    //
}

function getCommitsHtmlComponent(commits) {
    let result = '<div class="commits">\n' +
        '        <div class="commits__header">\n' +
        '            <div class="commits__title">\n' +
        '                <a href="#" class="commits-list-link">Коммиты</a>\n' +
        '                <span>' + commits.length + '</span>\n' +
        '            </div>\n' +
        '\n' +
        '            <div class="commits__action">\n' +
        '                Свернуть\n' +
        '            </div>\n' +
        '        </div>' +
        '<div class="commits__list">';
    commits.forEach(commit => {
        result += getCommitItemHtmlComponent(commit);
    })
    result += '</div></div>'
    return result;
}

function getCommitItemHtmlComponent(commit) {
    return '<div class="commit-item">\n' +
        '                <div class="avatar-cell"></div>' +
        '                <div class="commit-detail">\n' +
        '                    <div class="commit-content">\n' +
        '                        <a href="' + commit.web_url + '" class="commit-message">\n' +
        commit.title +
        '                        </a>\n' +
        '                        <div class="commiter">\n' +
        '                            <div class="commiter-author">\n' +
        commit.author_name +
        '                            </div>\n' +
        '                            <div class="commiter-date">\n' +
        commit.authored_date +
        '                            </div>\n' +
        '                        </div>\n' +
        '                    </div>\n' +
        '                    <div class="commit-actions">\n' +
        '                        <div class="commit-sha-group">\n' +
        commit.short_id +
        '                        </div>\n' +
        '                    </div>' +
        '                </div>\n' +
        '            </div>\n';
}

function getMergeRequestHtmlComponent(mergeRequestData) {
    let statusText = mergeRequestData.state === 'merged' ? 'Слито' : mergeRequestData.state === 'closed' ? 'Закрыт' : mergeRequestData.state === 'opened' ? 'Открыт' : '-'
    let statusClass = mergeRequestData.state === 'merged' ? 'mr-merged' : mergeRequestData.state === 'closed' ? 'mr-closed' : mergeRequestData.state === 'opened' ? 'mr-open' : '-'
    return '<div class="mr-tab">\n' +
        '        <div class="mr-tab-header">\n' +
        '            <div class="mr-action ' + statusClass + '">\n' +
        '               ' + statusText + '' +
        '            </div>\n' +
        '            <div class="mr-date-created">\n' +
        '               ' + mergeRequestData.created_at + '' +
        '            </div>\n' +
        '            <div class="mr-author">\n' +
        '                <img width="24" alt="" src="' + mergeRequestData.author.avatar_url + '" style="border-radius: 50%;" loading="lazy">' +
        '               ' + mergeRequestData.author.name + '' +
        '            </div>\n' +
        '        </div>\n' +
        '        <div class="mr-tab-title">\n' +
        '            <div class="mr-icon">\n' +
        '                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" height="24px" width="24px" viewBox="0 0 16 16" id="git-merge">\n' +
        '                    <path fill-rule="evenodd"\n' +
        '                          d="M10 0v2.6a5.002 5.002 0 0 1 3.995 4.674L14 7.5v3.768A2 2 0 0 1 13 15a2 2 0 0 1-1.134-3.647l.134-.085V7.5a3 3 0 0 0-1.828-2.762L10 4.67V7L6 3.5 10 0zM3 1a2 2 0 0 1 1.134 3.647L4 4.732v6.536A2 2 0 0 1 3 15a2 2 0 0 1-1.134-3.647L2 11.268V4.732A2 2 0 0 1 3 1z"/>\n' +
        '                </svg>\n' +
        '            </div>\n' +
        '        ' + mergeRequestData.title + '' +
        '        </div>\n' +
        '        <div class="mr-tab-branch">\n' +
        '            <div>Запрос на слияние\n' +
        '                <a href="#">\n' +
        '                   ' + mergeRequestData.source_branch + '' +
        '                </a>\n' +
        '                в\n' +
        '                <a href="#">\n' +
        '                   ' + mergeRequestData.target_branch + '' +
        '                </a>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '        <div class="mr-tab-body">\n' +
        '\n' +
        '        </div>\n' +
        '    </div>'

}

function searchMergeRequest(taskId) {
    return request('projects/46/merge_requests?search=' + taskId + '&in=title')
}

function searchCommitsByMergeRequestId(mrId) {
    return request('projects/46/merge_requests/' + mrId + '/commits')
}

function getPipelinesByMergeRequestId(mrId) {
    return request('projects/46/merge_requests/' + mrId + '/pipelines')
}

function getPipelinesTestReport(pipelineId) {
    return request('projects/46/pipelines/' + pipelineId + '/test_report')
}


function request(url, method = 'GET') {
    console.log('token', token);
    console.log('host', host);
    const options = {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json;charset=UTF-8",
            /*"PRIVATE-TOKEN": "9QAnNDgx7RVwnxksonRX"*/
            "PRIVATE-TOKEN": token
        },
    };
    //return fetch('https://git.tag24.ru/api/v4/' + url, options)
    return fetch(host + url, options)
        .then((response) => response.json())
        .then((data) => {
            return Promise.resolve(data);
        })
        .catch(error => {
            return Promise.reject(error);
        });
}

