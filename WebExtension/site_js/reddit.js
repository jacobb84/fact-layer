//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

function addInformationToNode(obj) {
    if (obj != null) {
        let domain = obj.href.replace('http://', '').replace('https://', '');
        domain = domain.substring(0, domain.indexOf("/", 0));
        if (domain != 'i.redd.it' && domain != 'i.imgur.com') {
            browser.runtime.sendMessage({command: "getWebsiteByDomain", domain: domain}, function (response) {
                if (response != null && response.websiteResult != null) {
                    obj.className = obj.className + " " + getCSS(response.overallBias, response.websiteResult.OrganizationType);
                    obj.title = response.websiteResult.Name + " | " + response.biasText;
                }
            });
        }
    }
}

if (browser) {
    //Style initial posts
    let posts = document.querySelectorAll("div.ListingLayout-outerContainer a.styled-outbound-link");
    posts.forEach(function (obj, index) {
        addInformationToNode(obj);
    });

    //Monitor for infinite scroll
    let target = document.getElementsByTagName('body')[0];
    // create an observer instance
    let observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            let newPosts = document.querySelectorAll("div.ListingLayout-outerContainer a.styled-outbound-link");
            newPosts.forEach(function (obj, index) {
                addInformationToNode(obj);
            });
        });
    });

    // configuration of the observer:
    let config = {childList: true};

    // pass in the target node, as well as the observer options
    observer.observe(target, config);
}
