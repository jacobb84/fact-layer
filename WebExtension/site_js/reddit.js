//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

if (browser)
{
	$("span.domain").each(function(index, obj) {
		var domain = $(obj).find("a").html();

		browser.runtime.sendMessage({command: "getWebsite", domain: domain}, function(response) {
			if (response != null && response.websiteResult != null)
			{
				$(obj).parents("div.thing").addClass(getCSS(response.overallBias, response.websiteResult.OrganizationType));
				$(obj).attr("title", response.websiteResult.Name + " | " + response.biasText);
			}
		});
	});
}