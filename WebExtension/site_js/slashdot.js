//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

if (browser)
{
	$("a.story-sourcelnk").each(function(index, obj) {
		var domain = $(obj).attr("href");
		browser.runtime.sendMessage({command: "getWebsite", domain: domain}, function(response) {
			if (response != null && response.websiteResult != null)
			{
				console.log("sss");
				var span = $(obj).parents("span.extlnk");
				console.log(span);
				$(obj).addClass(getCSS(response.overallBias, response.websiteResult.OrganizationType));
				$(obj).attr("title", response.websiteResult.Name + " | " + response.biasText);
			}
		});
	});
}