
// configuration of the observer:
const config = { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] };

function decorateNode(node) {
    var $node = $(node),
        $links = $node.find('a.status-link, a.status-card')
    $links.each(function(ix, link){
        var $link = $(link),
            domain = $link.attr('href');
        browser.runtime.sendMessage({command: "getWebsiteByDomain", domain: domain}, function(response) {
            $link.addClass(getCSS(response.overallBias, response.websiteResult.OrganizationType));
            $link.attr("title", response.websiteResult.Name + " | " + response.biasText);
        });
    });
}
function watchColumn(column) {
    var target = column;
        // create an observer instance
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.tagName == 'ARTICLE'){
                        decorateNode(node);
                    }
                });
                $(mutation.target).find('.status__wrapper, .detailed-status__wrapper').each(function(ix, node){
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


	$("div.column").each(function (index, obj) {
		watchColumn(obj);
    });

    // and when new columns are created
    var colObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation){
            mutation.addedNodes.forEach(function(node) {
                if (node.tagName == 'DIV' && node.classList.contains('column')){
                    watchColumn(node);
                }
            });
        });
    });

    colObserver.observe(document, config);
}
