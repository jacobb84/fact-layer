//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}


function getCSS(bias, orgType)
{
	if (orgType == 4)
	{
		return "bias bias-satire";
	}
	else if (orgType == 5 || orgType == 8 || orgType == 9)
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
	
	return "bias bias-unknown";
}

if (browser)
{
	browser.runtime.sendMessage({command: "getBiasColors"}, function(response) {
		if (response != null && response.biasColors != null)
		{
			response.biasColors.forEach(function(biasColor) {
				document.documentElement.style.setProperty('--fl-' + biasColor.bias + '-color', biasColor.color);
			});
		}
	});
}