//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

if (browser) {
    document.querySelectorAll(".leading-6 a:not(.author), .metadata a").forEach(function (obj, index) {
        let domain = obj.textContent.trim();
        browser.runtime.sendMessage({command: "getWebsiteByDomain", domain: domain}, function (response) {
            if (response != null && response.websiteResult != null) {
                obj.className = obj.className + " " + getCSS(response.overallBias, response.websiteResult.OrganizationType);
                obj.title = response.websiteResult.Name + " | " + response.biasText;
            }
        });
    });
}
