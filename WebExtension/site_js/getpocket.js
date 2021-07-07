//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

if (browser) {
    $("cite.details > a.publisher").each(function (index, obj) {
        var domain = $(obj).attr("href").replace("https://getpocket.com/redirect?url=https%3A%2F%2F", "");
        domain = domain.replace("https://getpocket.com/redirect?url=http%3A%2F%2F", "");
        domain = domain.substring(0, domain.indexOf('%2F'));

        browser.runtime.sendMessage({command: "getWebsiteByDomain", domain: domain}, function (response) {

            if (response != null && response.websiteResult != null) {
                $(obj).addClass(getCSS(response.overallBias, response.websiteResult.OrganizationType));
                $(obj).attr("title", response.websiteResult.Name + " | " + response.biasText);
            }
        });
    });

    var detailsLink = $("cite:not(.details) > a");
    var domain = $(detailsLink).attr("href");
    browser.runtime.sendMessage({command: "getWebsiteByDomain", domain: domain}, function (response) {

        if (response != null && response.websiteResult != null) {
            $(detailsLink).addClass(getCSS(response.overallBias, response.websiteResult.OrganizationType));
            $(detailsLink).attr("title", response.websiteResult.Name + " | " + response.biasText);
        }
    });
}
