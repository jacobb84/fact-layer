//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

function addInformationToNode(obj)
{
	if (obj != null && $(obj).length > 0)
	{
		var domain = $(obj).parents("a").attr('href').replace('http://','').replace('https://','');
		domain = domain.substring(0, domain.indexOf("/", 0));
		console.log(domain);
		if (domain != 'i.redd.it' && domain != 'i.imgur.com') {
			browser.runtime.sendMessage({command: "getWebsite", domain: domain}, function(response) {
				if (response != null && response.websiteResult != null)
				{
					$(obj).parents("a").addClass(getCSS(response.overallBias, response.websiteResult.OrganizationType));
					$(obj).parents("a").attr("title", response.websiteResult.Name + " | " + response.biasText);
				}
			});
		}
	}
}

if (browser)
{
	//Style initial posts
	$("div.Post").each(function(index, obj) {
		addInformationToNode($(obj).find("a[data-click-id!=expando_open] .icon-outboundLink").last());
	});
	
	//Monitor for infinite scroll
	var target = $("div.Post").first().parent().parent().parent();
	// create an observer instance
	var observer = new MutationObserver(function(mutations) {
	  mutations.forEach(function(mutation) {
		  mutation.addedNodes.forEach(function(node) {
			addInformationToNode($("div.Post a[data-click-id!=expando_open] .icon-outboundLink", node).last());
		  });  
	  });    
	});
	 
	// configuration of the observer:
	var config = { childList: true };
	 
	// pass in the target node, as well as the observer options
	observer.observe(target[0], config);
}