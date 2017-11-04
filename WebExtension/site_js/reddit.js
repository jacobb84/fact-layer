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
				$(obj).attr("title", response.websiteResult.Name + " - " + response.biasText);
			}
		});
	});
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