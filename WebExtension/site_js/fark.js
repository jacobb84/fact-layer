//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

function addInformationToNode(obj) {
    if (obj != null && $(obj).length > 0) {
        var domain = $(obj).html();

        browser.runtime.sendMessage({command: "getWebsiteByDomain", domain: domain}, function (response) {
            if (response != null && response.websiteResult != null) {
                $(obj).addClass(getCSS(response.overallBias, response.websiteResult.OrganizationType));
                $(obj).attr("title", response.websiteResult.Name + " | " + response.biasText);
            }
        });
    }
}

if (browser) {
    //Style initial posts
    $("div.URLHover").each(function (index, obj) {
        addInformationToNode($(obj).find("a.outbound_link").last());
    });

    //Monitor for infinite scroll
    var target = $("#headline_container");
    // create an observer instance
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.tagName == 'TABLE') {
                    $("div.URLHover", node).each(function (index, obj) {
                        addInformationToNode($(obj).find("a.outbound_link").last());
                    });
                }
            });
        });
    });

    // configuration of the observer:
    var config = {childList: true};

    // pass in the target node, as well as the observer options
    observer.observe(target[0], config);
}
