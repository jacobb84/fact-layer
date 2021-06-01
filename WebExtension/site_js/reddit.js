//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

function addInformationToNode(obj) {
    if (obj != null && $(obj).length > 0) {
        var domain = $(obj).attr('href').replace('http://', '').replace('https://', '');
        domain = domain.substring(0, domain.indexOf("/", 0));
        if (domain != 'i.redd.it' && domain != 'i.imgur.com') {
            browser.runtime.sendMessage({command: "getWebsiteByDomain", domain: domain}, function (response) {
                if (response != null && response.websiteResult != null) {
                    $(obj).addClass(getCSS(response.overallBias, response.websiteResult.OrganizationType));
                    $(obj).attr("title", response.websiteResult.Name + " | " + response.biasText);
                }
            });
        }
    }
}

if (browser) {
    //Style initial posts
    $("div.ListingLayout-outerContainer a.styled-outbound-link").each(function (index, obj) {
        ;
        addInformationToNode(obj);
    });

    //Monitor for infinite scroll
    var target = $("body");
    // create an observer instance
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            $("div.ListingLayout-outerContainer a.styled-outbound-link").each(function (index, obj) {
                addInformationToNode(obj);
            });
        });
    });

    // configuration of the observer:
    var config = {childList: true};

    // pass in the target node, as well as the observer options
    observer.observe(target[0], config);
}
