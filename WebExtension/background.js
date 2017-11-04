//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

var orgSiteVersion = "1.1";
var aliasVersion = "1.0";
var factMappingsVersion = "1.0";
var factPacksVersion = "1.0";
var regOrgSiteVersion = "1.0";
var currentTab;
var manifest = browser.runtime.getManifest();
var websites =[];
var regexWebsites =[];
var aliasDomains = [];
var factMappings = [];
var factPacks = [];
var currentTabUrl = "";
var currentWebsite = null;
var currentArticle = null;

function binarySearch(array, key) {
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

function getWebsite(domain)
{
	domain = domain.replace(/^(www|amp|m|mobile)\./g, "");
	//See if this is an alias
	var aliasDomain = aliasDomains.find(function (newsSource) {
		return domain.endsWith(newsSource.alias);
	});
	
	
	if (aliasDomain)
	{
		domain = aliasDomain.host;
	}
	
	return binarySearch(websites, domain);
}

function getSitePages()
{
	websites = [];
	var api = "http://factlayer.azurewebsites.net/org_sites."+orgSiteVersion+".json?cachebust="+new Date().getTime();
	$.ajax({
		url: api,
		type: 'GET',
		success: function (returndata) {
			websites = returndata;
			browser.storage.local.set({
			  websites: websites,
			  websitesUpdated: new Date()
			});
		}
	});
}

function getRegexSitePages()
{
	console.log("get site pages");
	regexWebsites = [];
	var api = "http://factlayer.azurewebsites.net/org.sites.regex."+regOrgSiteVersion+".json?cachebust="+new Date().getTime();
	console.log(api);
	$.ajax({
		url: api,
		type: 'GET',
		success: function (returndata) {
			console.log(returndata);
			regexWebsites = returndata;
			browser.storage.local.set({
			  regexWebsites: regexWebsites,
			  regexWebsitesUpdated: new Date()
			});
		}
	});
}

function getAliases()
{
	aliasDomains = [];
	var api = "http://factlayer.azurewebsites.net/aliases."+aliasVersion+".json?cachebust="+new Date().getTime();
	$.ajax({
		url: api,
		type: 'GET',
		success: function (returndata) {
			aliasDomains = returndata;
			browser.storage.local.set({
			  aliases: aliasDomains,
			  aliasesUpdated: new Date()
			});
		}
	});
}

function getFactMappings()
{
	
	factMappings = [];
	var api = "http://factlayer.azurewebsites.net/fact.mappings."+factMappingsVersion+".json?cachebust="+new Date().getTime();
	console.log(api);
	$.ajax({
		url: api,
		type: 'GET',
		success: function (returndata) {
			
			factMappings = returndata;
			browser.storage.local.set({
			  factMappings: factMappings,
			  factMappingsUpdated: new Date()
			});
		}
	});
}

function getFactPacks()
{
	factPacks = [];
	var api = "http://factlayer.azurewebsites.net/fact.packs."+factPacksVersion+".json?cachebust="+new Date().getTime();
	$.ajax({
		url: api,
		type: 'GET',
		success: function (returndata) {
			factPacks = returndata;
			browser.storage.local.set({
			  factPacks: factPacks,
			  factPacksUpdated: new Date()
			});
		}
	});
}

function getIconImage(orgType)
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
/*
 * Updates the browserAction icon to reflect the information of the current page.
 */
function updateIcon(bias, orgType) {
	var iconColor = "#808080";
	var iconImage = getIconImage(orgType);
	
	if (bias == -3)
	{
		iconColor = "#0026FF";
	}
	else if (bias == -2)
	{
		iconColor = "#2E65A1";
	}
	else if (bias == -1)
	{
		iconColor = "#9DC8EB";
	}
	else if (bias == 0)
	{
		iconColor = "#9766A0";
	}
	else if (bias == 1)
	{
		iconColor = "#CB9A98";
	}
	else if (bias == 2)
	{
		iconColor = "#CB2127";
	}
	else if (bias == 3)
	{
		iconColor = "#FF0000";
	}
	
	if (orgType == 4)
	{
		iconColor = "#007F0E"; //We want satire to stand out a bit and the bias doesn't matter
	}
	else if (orgType == 5 || orgType == 8)
	{
		iconColor = "#000000"; //We want fake news / hate groups to stand out a bit and the bias doesn't matter
	} 
	
	var img = new Image();
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d", {alpha: false});
	img.src = 'icons/' + iconImage + '.png';
	img.onload = function () {
		ctx.clearRect(0, 0, 72, 72);
		ctx.fillStyle = iconColor;
		ctx.fillRect(0, 0, 72, 72);
		ctx.drawImage(img, 4, 4);
		
		browser.browserAction.setIcon({
			imageData: ctx.getImageData(0, 0, 72, 72),
			tabId: currentTab.id
		  });
	};
}

function getSourceOrgName(sourceOrgId)
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

function getOverallBias(sources)
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

function getBiasText(bias) {

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

function getIconText(bias, orgType) {

	if (orgType == 4)
	{
		return "Satire";
	}
	else if (orgType == 5)
	{
		return "Fake";
	} 
	else if (orgType == 5)
	{
		return "Hate Group";
	}
	  
  	return getBiasText(bias);
}

function getOrgType(orgType)
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

function getRegexWebsite(domain)
{
	domain = domain.replace(/^(www|amp|m|mobile)\./g, "");
	var websiteResult = regexWebsites.find(function (site) {
		var regex = new RegExp(site.Domain, 'gi');
		var isMatch = regex.test(domain);
		return isMatch;
	});
	return websiteResult;
}

/*
 * Switches currentTab and factcheck to reflect the currently active tab
 */
function updateActiveTab(tabId, changeInfo, tabInfo) {

  function updateTab(tabs) {
    if (tabs[0]) {
		currentTab = tabs[0];
	  if (currentTab.url != null && (currentTab.url != currentTabUrl || (typeof(changeInfo) != "undefined" && changeInfo.status == "loading")))
	  {
		currentTabUrl = currentTab.url;
		currentWebsite = null;
		currentArticle = null;
		browser.browserAction.setBadgeText({
			text: "",
			tabId: currentTab.id
		});

		updateIcon();
		browser.browserAction.disable(currentTab.id);
		
		var managedUrl = new URL(currentTab.url);
		var path = managedUrl.pathname + managedUrl.search;

		var websiteResult = getWebsite(managedUrl.hostname);
		if (websiteResult == null)
		{
			websiteResult = getRegexWebsite(managedUrl.hostname)
		}
		if (websiteResult != null)
		{
			currentWebsite = websiteResult;
			var totalBias = getOverallBias(websiteResult.Sources);
			browser.browserAction.setTitle({
				title: getIconText(totalBias, websiteResult.OrganizationType),
				tabId: currentTab.id
			});
			updateIcon(totalBias, websiteResult.OrganizationType);
			browser.browserAction.enable(currentTab.id);
			
			var factResultDomain = factMappings.find(function (mapping) {
				return mapping.Domain == websiteResult.Domain;
			});
			
			if (factResultDomain != null)
			{
				var factResultPage = factResultDomain.Pages.find(function (page) {
					return page.Path == path;
				});

				if (factResultPage != null)
				{
					currentArticle = factResultPage;
					if (factResultPage.RefutedBy.length > 0)
					{
						browser.browserAction.setBadgeBackgroundColor({
							color: "#d6150e",
							tabId: currentTab.id
						});
						
						browser.browserAction.setBadgeText({
							text: factResultPage.RefutedBy.length.toString(),
							tabId: currentTab.id
						});
					}
				}
			}
		} 
	  }
    }
  }
	
  browser.tabs.query({active: true, currentWindow: true}, updateTab);
}
browser.storage.local.get(["regexWebsites","regexWebsitesUpdated", "websites","websitesUpdated", "installedVersion", "aliases", "aliasesUpdated", "factMappings", "factMappingsUpdated", "factPacks", "factPacksUpdated"], onGotItems);

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

function onGotItems(item) {
  if (item != null && $.isEmptyObject(item) || item.length === 0)
  {
	  getSitePages();
	  getAliases();
	  getFactMappings();
	  getFactPacks();
	  getRegexSitePages();
	  browser.storage.local.set({
		  installedVersion: manifest.version
		});
  } else { 
	  if (item.websites != null && item.websitesUpdated != null) 
	  {
			var tomorrow = new Date(item.websitesUpdated);
			tomorrow.setDate(tomorrow.getDate() + 1);

	        if (new Date() < tomorrow) {
				websites = item.websites;
			} else {
				getSitePages();
			}
			
	  } else {
		  getSitePages();
	  }
	  
	  if (item.aliases != null && item.aliasesUpdated != null) 
	  {
			var tomorrow = new Date(item.aliasesUpdated);
			tomorrow.setDate(tomorrow.getDate() + 1);

	        if (new Date() < tomorrow) {
				aliasDomains = item.aliases;
			} else {
				getAliases();
			}
			
	  } else {
		  getAliases();
	  }		
	  
	  if (item.factMappings != null && item.factMappingsUpdated != null) 
	  {
			var tomorrow = new Date(item.factMappingsUpdated);
			tomorrow.setDate(tomorrow.getDate() + 1);

	        if (new Date() < tomorrow) {
				factMappings = item.factMappings;
			} else {
				getFactMappings();
			}
			
	  } else {
		  getFactMappings();
	  }	
	  
	  if (item.factPacks != null && item.factPacksUpdated != null) 
	  {
			var tomorrow = new Date(item.factPacksUpdated);
			tomorrow.setDate(tomorrow.getDate() + 1);

	        if (new Date() < tomorrow) {
				factPacks = item.factPacks;
			} else {
				getFactPacks();
			}
			
	  } else {
		  getFactPacks();
	  }	
	  
	  if (item.regexWebsites != null && item.regexWebsitesUpdated != null) 
	  {
			var tomorrow = new Date(item.regexWebsitesUpdated);
			tomorrow.setDate(tomorrow.getDate() + 1);

	        if (new Date() < tomorrow) {
				regexWebsites = item.regexWebsites;
			} else {
				getRegexSitePages();
			}
			
	  } else {
		  getRegexSitePages();
	  }	
	  
	  //Be sure to get latest version of website objects if we just upgraded
	  if (item.installedVersion == null || item.installedVersion != manifest.version)
	  {
		 getSitePages();
		 getAliases();
		 getFactMappings();
		 getFactPacks();
		 getRegexSitePages();
		 browser.storage.local.set({
		  installedVersion: manifest.version
		});
	  }
	  
  }

}

updateActiveTab();

browser.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	  if (request.command == "getWebsite")
	  {
		  var websiteResult = getWebsite(request.domain);
		  var biasText = "Unknown";
		  var overallBias = -2147483648;
		  if (websiteResult != null)
		  {
			  overallBias = getOverallBias(websiteResult.Sources);
			  biasText = getIconText(overallBias, websiteResult.OrganizationType);
		  }
		  sendResponse({websiteResult: websiteResult, biasText: biasText, overallBias: overallBias});
	  }

  });


