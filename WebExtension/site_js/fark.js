//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

if (browser)
{
	$("div.URLHover a.outbound_link").each(function(index, obj) {
		var domain = $(obj).html();

		browser.runtime.sendMessage({command: "getWebsiteByDomain", domain: domain}, function(response) {
			if (response != null && response.websiteResult != null)
			{
				$(obj).addClass(getCSS(response.overallBias, response.websiteResult.OrganizationType));
				$(obj).attr("title", response.websiteResult.Name + " | " + response.biasText);
			}
		});
	});
}
