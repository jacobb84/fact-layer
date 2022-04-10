//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

function addInformationToNode(obj) {
    if (obj != null) {
        let domain = obj.textContent.trim();
        browser.runtime.sendMessage({command: "getWebsiteByDomain", domain: domain}, function (response) {
            if (response != null && response.websiteResult != null) {
                obj.className = obj.className + " " + getCSS(response.overallBias, response.websiteResult.OrganizationType);
                obj.title = response.websiteResult.Name + " | " + response.biasText;
            }
        });
    }
}

if (browser) {
    //Style initial posts
    document.querySelectorAll("div.URLHover").forEach(function (obj, index) {
        let nodes = obj.querySelectorAll("a.outbound_link");
        if (nodes.length > 0) {
            let last = nodes[nodes.length - 1];
            addInformationToNode(last);
        }
    });

    //Monitor for infinite scroll
    let target = document.querySelector("#headline_container");
    // create an observer instance
    let observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.tagName == 'TABLE') {
                    node.querySelectorAll("div.URLHover").forEach(function (obj, index) {
                        let nodes = obj.querySelectorAll("a.outbound_link");
                        if (nodes.length > 0) {
                            let last = nodes[nodes.length - 1];
                            addInformationToNode(last);
                        }
                    });
                }
            });
        });
    });

    // configuration of the observer:
    let config = {childList: true};

    // pass in the target node, as well as the observer options
    observer.observe(target[0], config);
}
