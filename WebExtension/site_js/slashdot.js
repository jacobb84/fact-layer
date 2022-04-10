//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

if (browser) {
    document.querySelectorAll("a.story-sourcelnk").forEach(function(obj, index)
    {
        let domain = obj.href;
        browser.runtime.sendMessage({command: "getWebsiteByDomain", domain: domain}, function (response) {
            if (response != null && response.websiteResult != null) {
                obj.className = obj.className + " " + getCSS(response.overallBias, response.websiteResult.OrganizationType);
                obj.title = response.websiteResult.Name + " | " + response.biasText;
            }
        });
    });
}
