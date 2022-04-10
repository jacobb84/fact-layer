// configuration of the observer:
const config = {childList: true, subtree: true, attributes: true, attributeFilter: ['class']};

function decorateNode(node) {
    let links = node.querySelectorAll('a.status-link, a.status-card');
    links.forEach(function (link, ix) {
        let domain = link.href;
        browser.runtime.sendMessage({command: "getWebsiteByDomain", domain: domain}, function (response) {
            link.className = link.className + " " + getCSS(response.overallBias, response.websiteResult.OrganizationType);
            link.title = response.websiteResult.Name + " | " + response.biasText;
        });
    });
}

function watchColumn(column) {
    let target = column;
    // create an observer instance
    let observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.tagName == 'ARTICLE') {
                    decorateNode(node);
                }
            });
            mutation.target.querySelectorAll('.status__wrapper, .detailed-status__wrapper').forEach(function (node, ix) {
                decorateNode(node);
            });
        });
    });

    observer.observe(target, config);
}

//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

if (browser) {

    document.querySelectorAll("div.column").forEach(function (obj, index) {
        watchColumn(obj);
    });

    // and when new columns are created
    let colObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.tagName == 'DIV' && node.classList.contains('column')) {
                    watchColumn(node);
                }
            });
        });
    });

    colObserver.observe(document, config);
}
