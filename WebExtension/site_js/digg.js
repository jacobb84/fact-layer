//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

function addInformationToNode(obj)
{
	if (obj != null && $(obj).length > 0)
	{
		var storyLink = $(obj).find("a.js--digg-story__link, a.peek-module__article-title-link");
		var sourceTag = $(obj).find("span.digg-story__metadata-source, a.digg-story__related-link__source-link");
		var domain = $(storyLink).attr("href");
		
		browser.runtime.sendMessage({command: "getWebsiteByDomain", domain: domain}, function(response) {
			if (response != null && response.websiteResult != null)
			{
				$(sourceTag).removeClass("bias-extreme-left bias-left bias-left-center bias-center bias-right-center bias-right bias-extreme-right bias-satire bias-fake");
				$(sourceTag).addClass(getCSS(response.overallBias, response.websiteResult.OrganizationType));
				$(sourceTag).attr("title", response.websiteResult.Name + " | " + response.biasText);
			}
		});
	}
}

if (browser)
{
	$("article.digg-story:not(.digg-story--video), article.peek-module__article").each(function(index, obj) {
		addInformationToNode(obj);
	});
	
	// monitor ajax loaded streams
	$("div.js--digg-story-stream, div.js--digg-story-stream__stories, section.popular-stories div.content, section.upcoming-stories div.content").each(function (index, obj) {
		var target = obj;

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
	});
	
	//monitor related news overlays
	$("#js--story-sources__related").each(function (index, obj) {
		var target = obj;
		// create an observer instance
		var observer = new MutationObserver(function(mutations) {
		  mutations.forEach(function(mutation) {
			  $(mutation.addedNodes[0].children).each(function (index, node) {
				addInformationToNode(node);
			  });  
		  });    
		});
		 
		// configuration of the observer:
		var config = { childList: true };
		 
		// pass in the target node, as well as the observer options
		observer.observe(target, config);
	});
}