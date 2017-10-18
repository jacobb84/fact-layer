var isChrome = false;
//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
	isChrome = true;
}

if (browser)
{
	var aliasDomains = 
[
	{
	  "alias": "apnews.com",
	  "host": "ap.org"
	},
	{
	  "alias": "bbc.co.uk",
	  "host": "bbc.com"
	}
]

	browser.storage.local.get(["websites"], onGotItems);

	function onGotItems(item) {
		var websites = item.websites;
	  	$("span.domain").each(function(index, obj) {
			var domain = obj.innerHTML;
			var aliasDomain = aliasDomains.filter(function (newsSource) {
				return domain.indexOf(newsSource.alias)  != -1;
			})[0];
			
			if (aliasDomain)
			{
				domain = aliasDomain.host;
			}
			
			var websiteResult = websites.filter(function (newsSource) {
				return domain.indexOf(newsSource.Domain) != -1;
			})[0];
			
			if (websiteResult != null)
			{
				$(obj).parents("div.thing").addClass(getCSS(websiteResult.Bias, websiteResult.OrganizationType));
				$(obj).attr("title", getBiasText(websiteResult.Bias, websiteResult.OrganizationType));
			}
		});
	}
}

function getBiasText(bias, orgType) {

	if (orgType == 4)
	{
		return "Satire";
	}
	else if (orgType == 5)
	{
		return "Fake";
	}
	
	if (bias == -3)
	{
		return "Extreme Left";
	}
	else if (bias == -2)
	{
		return "Left";
	}
	else if (bias == -1)
	{
		return "Left-Center";
	}
	else if (bias == 0)
	{
		return "Center";
	}
	else if (bias == 1)
	{
		return "Right-Center";
	}
	else if (bias == 2)
	{
		return "Right";
	} 
	else if (bias == 3)
	{
		return "Extreme Right";
	}
	  
  	return "Unknown";
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