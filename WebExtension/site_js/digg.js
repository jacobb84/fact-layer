//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

if (browser) {
    $(".leading-6 a:not(.author), .metadata a").each(function (index, obj) {
        var domain = $(obj).html();
        browser.runtime.sendMessage({command: "getWebsiteByDomain", domain: domain}, function (response) {
            if (response != null && response.websiteResult != null) {
                $(obj).addClass(getCSS(response.overallBias, response.websiteResult.OrganizationType));
                $(obj).attr("title", response.websiteResult.Name + " | " + response.biasText);
            }
        });
    });
}
