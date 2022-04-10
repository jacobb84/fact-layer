//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

if (browser) {
    document.querySelectorAll("cite.details > a.publisher").forEach(function (obj, index) {
        let domain = obj.href;
        browser.runtime.sendMessage({command: "getWebsiteByDomain", domain: domain}, function (response) {

            if (response != null && response.websiteResult != null) {
                obj.className = obj.className + " " + getCSS(response.overallBias, response.websiteResult.OrganizationType);
                obj.title = response.websiteResult.Name + " | " + response.biasText;
            }
        });
    });

    let detailsLink = document.querySelector("cite:not(.details) > a");
    let domain = detailsLink.href;
    browser.runtime.sendMessage({command: "getWebsiteByDomain", domain: domain}, function (response) {

        if (response != null && response.websiteResult != null) {
            detailsLink.className = obj.className + " " + getCSS(response.overallBias, response.websiteResult.OrganizationType);
            detailsLink.title = response.websiteResult.Name + " | " + response.biasText;
        }
    });
}
