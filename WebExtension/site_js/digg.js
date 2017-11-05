//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

function addInformationToNode(obj)
{
	if (obj != null && $(obj).length > 0)
	{
		var storyLink = $(obj).find("a.js--digg-story__link, a.peek-module__article-title-link");
		var spanTag = $(obj).find("span.digg-story__metadata-source");
		var domain = $(storyLink).attr("href");
	
		browser.runtime.sendMessage({command: "getWebsite", domain: domain}, function(response) {
			if (response != null && response.websiteResult != null)
			{
				$(spanTag).addClass(getCSS(response.overallBias, response.websiteResult.OrganizationType));
				$(spanTag).attr("title", response.websiteResult.Name + " - " + response.biasText);
			}
		});
	}
}

if (browser)
{
	$("article.digg-story, article.peek-module__article").each(function(index, obj) {
		addInformationToNode(obj);
	});
	
	// select the target node
	if ($(".js--digg-story-stream") != null && $(".js--digg-story-stream") > 0)
	{
		var target = $(".js--digg-story-stream__stories")[0];

		// create an observer instance
		var observer = new MutationObserver(function(mutations) {
		  mutations.forEach(function(mutation) {

			  mutation.addedNodes.forEach(function(node) {

				if ($(node).prop("tagName") == "ARTICLE")
				{
					addInformationToNode(node);
				}
				
			  });  
		  });    
		});
		 
		// configuration of the observer:
		var config = { childList: true };
		 
		// pass in the target node, as well as the observer options
		observer.observe(target, config);
	}
	
}

function getCSS(bias, orgType)
{
	if (orgType == 4)
	{
		return "bias bias-satire";
	}
	else if (orgType == 5)
	{
		return "bias bias-fake";
	}
	
	if (bias == -3)
	{
		return "bias bias-extreme-left";
	} 
	else if (bias == -2)
	{
		return "bias bias-left";
	}
	else if (bias == -1) 
	{
		return "bias bias-left-center";
	} 
	else if (bias == 0)
	{
		return "bias bias-center";
	}
	else if (bias == 1)
	{
		return "bias bias-right-center";
	}
	else if (bias == 2)
	{
		return "bias bias-right";
	}
	else if (bias == 3)
	{
		return "bias bias-extreme-right";
	}
}