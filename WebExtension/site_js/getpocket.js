//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

if (browser)
{
	$("cite.details").each(function(index, obj) {
		var nameSpan = $(obj).find("> span:first");
		var name = $(nameSpan).html();
		
		browser.runtime.sendMessage({command: "getWebsiteByName", name: name}, function(response) {
			
			if (response != null && response.websiteResult != null)
			{
				$(nameSpan).addClass(getCSS(response.overallBias, response.websiteResult.OrganizationType));
				$(nameSpan).attr("title", response.websiteResult.Name + " | " + response.biasText);
			}
		});
	});

	var detailsLink = $("div.spacing div:last a");
	var domain = $(detailsLink).attr("href");
	browser.runtime.sendMessage({command: "getWebsiteByDomain", domain: domain}, function(response) {
			
		if (response != null && response.websiteResult != null)
		{
			$(detailsLink).addClass(getCSS(response.overallBias, response.websiteResult.OrganizationType));
			$(detailsLink).attr("title", response.websiteResult.Name + " | " + response.biasText);
		}
	});
}