var currentTab;

var websites =[]
var factChecks = [];
var factMappings = [];
var aliasDomains = 
[
	{
	  "alias": "apnews.com",
	  "host": "ap.org"
	}
]

var currentTabUrl = "";
var currentWebsite = null;
var currentArticle = null;
function getFactPages()
{
	factChecks = [];
	var api = "http://factlayer.referata.com/w/api.php?action=ask&format=json&query=[[Category:Fact%20Checks]]|%3FHas%20Name|%3FIs%20Rated|limit%3D10000";
	$.ajax({
		url: api,
		type: 'GET',
		success: function (returndata) {
			if (returndata.query != null)
			{
				var pages = Object.keys(returndata.query.results);
				for(var i = 0; i < pages.length; i++)
				{
					var key = pages[i];
					var result = returndata.query.results[key];
					if (result != null)
					{
						var keyArray = key.split('#');
						var factName = keyArray[0];
						var factCheckSource = keyArray[1];
						
						var factCheck = factChecks.filter(function (factPage) {
							return factName == factPage.Name;
						})[0];
					
					
						var rated = result.printouts["Is Rated"][0];
					
						factCheck = {
							Name: key,
							Rated: rated,
							Sources : []
						}

						
						factChecks.push(factCheck);
					} 
				}

				getFactChecks()
			}
			
		}
	});
}
function getFactChecks()
{
	var api = "http://factlayer.referata.com/w/api.php?action=ask&format=json&query=[[Rated::+]]|%3FTitle%23|%3FURL|%3FRated|limit%3D10000";
	$.ajax({
		url: api,
		type: 'GET',
		success: function (returndata) {
			if (returndata.query != null)
			{
				var pages = Object.keys(returndata.query.results);
				for(var i = 0; i < pages.length; i++)
				{
					var key = pages[i];

					var result = returndata.query.results[key];
					if (result != null)
					{
						var keyArray = key.split('#');
						var factName = keyArray[0];
						var factCheckSource = keyArray[1];
						
						var factCheck = factChecks.filter(function (factPage) {
							return factName == factPage.Name;
						})[0];
					
					
						var title = result.printouts["Title"][0].fulltext;
						var url = result.printouts["URL"][0];
						var rated = result.printouts["Rated"][0].fulltext;
					

						factCheck.Sources.push(
							{
								Name: factCheckSource,
								Title: title,
								URL: url,
								Rated: rated
							}
						)
					}  
				}
				
				
				browser.storage.local.set({
				  factChecks: factChecks,
				  factChecksUpdated: new Date()
				});
			}
		}
	});
}


function getSitePages()
{
	websites = [];
	var api = "http://factlayer.referata.com/w/api.php?action=ask&format=json&query=[[Category:Websites]]|%3FHas%20Title%23|%3FHas%20Domain|%3FHas%20Wikipedia|%3FHas%20Bias|%3FHas%20Description|limit%3D10000";
	$.ajax({
		url: api,
		type: 'GET',
		success: function (returndata) {
			if (returndata.query != null)
			{
				var pages = Object.keys(returndata.query.results);
				console.log(pages.length);
				for(var i = 0; i < pages.length; i++)
				{
					var key = pages[i];
					var result = returndata.query.results[key];
					if (result != null)
					{
						var siteName = key;			
						var domain = result.printouts["Has Domain"][0];
						var wikipedia = result.printouts["Has Wikipedia"][0];
						var bias = result.printouts["Has Bias"][0];
						var description = result.printouts["Has Description"][0];
						
						if (domain != null)
						{
							var site = {
								Name: key,
								Domain: domain.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1],
								Wikipedia: wikipedia,
								Bias: 
								{
									Rating: bias,
									Sources: []
								},
								Description: description
							}
							
							websites.push(site);
						}
					} 
				}
				getSiteBiasSources()
			}
			
		}
	});
}
function getSiteBiasSources()
{
	var api = "http://factlayer.referata.com/w/api.php?action=ask&format=json&query=[[Bias::+]]|%3FURL|%3FBias|limit%3D10000";
	$.ajax({
		url: api,
		type: 'GET',
		success: function (returndata) {
			if (returndata.query != null)
			{
				var pages = Object.keys(returndata.query.results);
				for(var i = 0; i < pages.length; i++)
				{
					var key = pages[i];

					var result = returndata.query.results[key];
					if (result != null)
					{
						var keyArray = key.split('#');
						var siteName = keyArray[0];
						var biasSource = keyArray[1];
						
						var site = websites.filter(function (site) {
							return siteName == site.Name;
						})[0];
					
						if (site != null)
						{
							var url = result.printouts["URL"][0];
							var bias = result.printouts["Bias"][0].fulltext;
						
							
							site.Bias.Sources.push(
								{
									Name: biasSource,
									URL: url,
									Bias: bias
								}
							)
						}

					}  
				}
				
				
				browser.storage.local.set({
				  websites: websites,
				  websitesUpdated: new Date()
				});
			}
		}
	});
}

function getFactMappings()
{
	factMappings = [];
	var api = "http://factlayer.referata.com/w/api.php?action=ask&format=json&query=[[Category:Articles]]|%3FHas%20URL|%3FIs%20Supported%20By|%3FIs%20Refuted%20By|limit%3D10000";
	$.ajax({
		url: api,
		type: 'GET',
		success: function (returndata) {
			if (returndata.query != null)
			{
				var pages = Object.keys(returndata.query.results);
				for(var i = 0; i < pages.length; i++)
				{
					var key = pages[i];

					var result = returndata.query.results[key];
					if (result != null)
					{
						var url = result.printouts["Has URL"][0];
						var factMapping = {
							URL: url,
							SupportedBy: [],
							RefutedBy: []
						}

						for(var j = 0; j < result.printouts["Is Supported By"].length; j++)
						{
							var supportedBy = result.printouts["Is Supported By"][j].fulltext;
							factMapping.SupportedBy.push(supportedBy);
						}
						for(var j = 0; j < result.printouts["Is Refuted By"].length; j++)
						{
							var refutedBy = result.printouts["Is Refuted By"][j].fulltext;
							factMapping.RefutedBy.push(refutedBy);
						}
						
						factMappings.push(factMapping);
					}  
				}
				
				browser.storage.local.set({
				  factMappings: factMappings,
				  factMappingsUpdated: new Date()
				});
			}
		}
	});
}

/*
 * Updates the browserAction icon to reflect the information of the current page.
 */
function updateIcon(bias, validity) {
	var iconPath = 
	{
	  19: "icons/noinfo_19.png",
	  38: "icons/noinfo_38.png"
	};
	
	
	if (bias == "Left")
	{
		iconPath = 
		{
		  19: "icons/farleft_warning_19.png",
		  38: "icons/farleft_warning_38.png"
		};
	}
	else if (bias == "Left-Center")
	{
		iconPath = 
		{
		  19: "icons/midleft_valid_19.png",
		  38: "icons/midleft_valid_38.png"
		};
	}
	else if (bias == "Center")
	{
		iconPath = 
		{
		  19: "icons/center_valid_19.png",
		  38: "icons/center_valid_38.png"
		};
	}
	else if (bias == "Right-Center")
	{
		iconPath = 
		{
		  19: "icons/midright_valid_19.png",
		  38: "icons/midright_valid_38.png"
		};
	}
	else if (bias == "Right")
	{
		iconPath = 
		{
		  19: "icons/farright_warning_19.png",
		  38: "icons/farright_warning_38.png"
		};
	}
	else if (bias == "Satire")
	{
		iconPath = 
		{
		  19: "icons/satire_19.png",
		  38: "icons/satire_38.png"
		};
	}
	else if (bias == "Fake")
	{
		iconPath = 
		{
		  19: "icons/bogus_19.png",
		  38: "icons/bogus_38.png"
		};
	}
  
  	browser.browserAction.setIcon({
		path: iconPath,
		tabId: currentTab.id
	  });

}

function getBiasText(bias) {
	
	if (bias == -2)
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
	else if (bias == 1001)
	{
		return "Satire";
	}
	else if (bias == 1002)
	{
		return "Fake";
	}
  
  	return "Unknown";
}

/*
 * Switches currentTab and factcheck to reflect the currently active tab
 */
function updateActiveTab(tabs) {

  function updateTab(tabs) {
    if (tabs[0]) {
      currentTab = tabs[0];

	  if (currentTab.url != null && currentTab.url != currentTabUrl)
	  {
		currentTabUrl = currentTab.url;
		currentWebsite = null;
		currentArticle = null;
		factpacks = {};
		browser.browserAction.setBadgeText({
			text: "",
			tabId: currentTab.id
		});
		updateIcon("unknown");
		browser.browserAction.disable(currentTab.id);
		
		var matches = currentTab.url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/);
		if (matches != null)
		{
			var domain = matches[1];
			domain = domain.replace("www.","");
			//See if this is an alias
			var aliasDomain = aliasDomains.filter(function (newsSource) {
				return domain.endsWith(newsSource.alias);
			})[0];
			
			if (aliasDomain)
			{
				domain = aliasDomain.Host;
			}
			
			var websiteResult = websites.filter(function (newsSource) {
				return domain.endsWith(newsSource.Domain);
			})[0];
			
			if (websiteResult != null)
			{
				currentWebsite = websiteResult;
				browser.browserAction.setTitle({
					title: websiteResult.Bias.Rating,
					tabId: currentTab.id
				});
				updateIcon(websiteResult.Bias.Rating);
				browser.browserAction.enable(currentTab.id);
				
				var factResult = factMappings.filter(function (article) {
					return currentTab.url.toLowerCase().startsWith(article.URL);
				})[0];
				
				if (factResult != null)
				{
					currentArticle = factResult;
					if (factResult.RefutedBy.length > 0 && factResult.SupportedBy.length == 0)
					{
						browser.browserAction.setBadgeBackgroundColor({
							color: "#d6150e",
							tabId: currentTab.id
						});
						
						browser.browserAction.setBadgeText({
							text: factResult.RefutedBy.length.toString(),
							tabId: currentTab.id
						});
					}
					else if (factResult.SupportedBy.length > 0 && factResult.RefutedBy.length == 0)
					{
						browser.browserAction.setBadgeBackgroundColor({
							color: "#00990f",
							tabId: currentTab.id
						});
						
						browser.browserAction.setBadgeText({
							text: factResult.SupportedBy.length.toString(),
							tabId: currentTab.id
						});
					}
				}
			} 
		} 
	  }
    }
  }

  var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
  gettingActiveTab.then(updateTab);
}
// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);



var gettingItem = browser.storage.local.get(["factChecks","websites","factMappings"]);
gettingItem.then(onGotItems, onError);

function onGotItems(item) {

  if (item != null && $.isEmptyObject(item) || item.length === 0)
  {
	  console.log("loading from web");
	  getFactPages();
	  getSitePages();
	  getFactMappings();
  } else {
	  console.log("loading from storage");
	  if (item.factChecks != null)
	  {
		  factChecks = item.factChecks;
	  } else {
		  getFactPages();
	  }
	  
	  if (item.websites != null)
	  {
		  websites = item.websites;
	  } else {
		  getSitePages();
	  }
	  
	  if (item.factMappings != null)
	  {
		  factMappings = item.factMappings;
	  } else {
		  getFactMappings();
	  }
	  
  }

}

function onError(error) {
  getFactPages();
  getSitePages();
  getFactMappings();
  console.log('Error: ${error}');
}


updateActiveTab();


