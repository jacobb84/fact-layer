function FactLayerUtilities()
{
	
}

FactLayerUtilities.getBiasText = function (bias) {
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

FactLayerUtilities.getOrgTypeText = function (orgType)
{
	if (orgType == 0)
	{
		return "News / Media";
	} 
	else if (orgType == 1)
	{
		return "Think Tank";
	} 
	else if (orgType == 2)
	{
		return "Blog";
	} 
	else if (orgType == 3)
	{
		return "Activist Organization";
	} 
	else if (orgType == 4)
	{
		return "Satire";
	} 
	else if (orgType == 5)
	{
		return "Fake News / Extremely Unreliable";
	} 
	else if (orgType == 6)
	{
		return "Non-Profit / Charity";
	} 
	else if (orgType == 7)
	{
		return "Fact-Checker / Reference Site";
	} 
	else if (orgType == 8)
	{
		return "Hate Group";
	} 
	else 
	{
		return "Unknown / Other";
	}
}

FactLayerUtilities.getSourceOrgName = function(sourceOrgId)
{
	if (sourceOrgId ==  0)
	{
		return "AllSides";
	} 
	else if (sourceOrgId == 1)
	{
		return "Media Bias / Fact Check";	
	}
	else if (sourceOrgId == 2)
	{
		return "Real or Satire";
	}
	else if (sourceOrgId == 3)
	{
		return "Charity Navigator";
	}
	else if (sourceOrgId == 4)
	{
		return "The Fake News Codex";
	}
	else if (sourceOrgId == 5)
	{
		return "Duke Reporters' Lab";
	}
	else if (sourceOrgId == 6)
	{
		return "TVNewsCheck";
	}
}

FactLayerUtilities.getOverallBias = function(sources)
{
	if (sources.length > 0)
	{
		var biasSources = sources.filter(function (src) {
			return src.ClaimType == 0;
		});
		//Get the average
		var totalBias = 0;
		var len = biasSources.length;
		for (var i = 0; i < len; i++) {
			var source = biasSources[i];
			totalBias += source.ClaimValue;
		}
		
		if (totalBias < 0)
		{
			return Math.floor(totalBias / len);
		} else
		{
			return Math.ceil(totalBias / len);
		}
	} else
	{
		//Return Unknown
		return -2147483648;
	}
}

FactLayerUtilities.getIconImage = function(orgType)
{
	if (orgType == 0 || orgType == 2)
	{
		return "news";
	} 
	else if (orgType == 1)
	{
		return "thinktank";
	}
	else if (orgType == 3)
	{
		return "activist";
	}
	else if (orgType == 4)
	{
		return "satire";
	}
	else if (orgType == 5)
	{
		return "fake";
	} 
	else if (orgType == 6)
	{
		return "nonprofit";
	}
	else if (orgType == 7)
	{
		return "factcheck";
	} 
	else if (orgType == 8)
	{
		return "hategroup";
	}
	else {
		return "unknown";
	}
}

FactLayerUtilities.getIconColor = function(bias, orgType)
{
	if (orgType == 4)
	{
		return "#007F0E"; //We want satire to stand out a bit and the bias doesn't matter
	}
	else if (orgType == 5 || orgType == 8)
	{
		return "#000000"; //We want fake news / hate groups to stand out a bit and the bias doesn't matter
	} 
	
	if (bias == -3)
	{
		return "#0026FF";
	}
	else if (bias == -2)
	{
		return "#2E65A1";
	}
	else if (bias == -1)
	{
		return "#9DC8EB";
	}
	else if (bias == 0)
	{
		return "#9766A0";
	}
	else if (bias == 1)
	{
		return "#CB9A98";
	}
	else if (bias == 2)
	{
		return "#CB2127";
	}
	else if (bias == 3)
	{
		return "#FF0000";
	}
	
	return "#CCCCCC";
}

FactLayerUtilities.binarySearch = function(array, key) {
	var lo = 0,
		hi = array.length - 1,
		mid,
		element;
	while (lo <= hi) {
		mid = ((lo + hi) >> 1);
		element = array[mid];

		if (element.Domain.localeCompare(key) == -1) {
			lo = mid + 1;
		} else if (element.Domain.localeCompare(key) == 1) {
			hi = mid - 1;
		} else {
			return element;
		}
	}
	return null;
}