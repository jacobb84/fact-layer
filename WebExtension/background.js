var currentTab;
var isChrome = false;
var websites =[]
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

var currentTabUrl = "";
var currentWebsite = null;

//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
	isChrome = true;
}


function getSitePages()
{
	websites = [];
	var api = "http://factlayer.azurewebsites.net/org_sites.json?cachebust="+new Date();
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

/*
 * Updates the browserAction icon to reflect the information of the current page.
 */
function updateIcon(bias, orgType) {
	var iconPath = 
	{
	  19: "icons/noinfo_19.png",
	  38: "icons/noinfo_38.png"
	};
	
	if (bias == -3)
	{
		iconPath = 
		{
		  19: "icons/farleft_invalid_19.png",
		  38: "icons/farleft_invalid_38.png"
		};
	}
	else if (bias == -2)
	{
		iconPath = 
		{
		  19: "icons/farleft_warning_19.png",
		  38: "icons/farleft_warning_38.png"
		};
	}
	else if (bias == -1)
	{
		iconPath = 
		{
		  19: "icons/midleft_valid_19.png",
		  38: "icons/midleft_valid_38.png"
		};
	}
	else if (bias == 0)
	{
		iconPath = 
		{
		  19: "icons/center_valid_19.png",
		  38: "icons/center_valid_38.png"
		};
	}
	else if (bias == 1)
	{
		iconPath = 
		{
		  19: "icons/midright_valid_19.png",
		  38: "icons/midright_valid_38.png"
		};
	}
	else if (bias == 2)
	{
		iconPath = 
		{
		  19: "icons/farright_warning_19.png",
		  38: "icons/farright_warning_38.png"
		};
	}
	else if (bias == 3)
	{
		iconPath = 
		{
		  19: "icons/farright_invalid_19.png",
		  38: "icons/farright_invalid_38.png"
		};
	}
	
	if (orgType == 4)
	{
		iconPath = 
		{
		  19: "icons/satire_19.png",
		  38: "icons/satire_38.png"
		};
	}
	else if (orgType == 5)
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

function getOrgType(orgType)
{
	if (orgType == 0)
	{
		return "News / Media";
	} else if (orgType == 1)
	{
		return "Think Tank";
	} else if (orgType == 2)
	{
		return "Blog";
	} else if (orgType == 3)
	{
		return "Activist Organization";
	} else if (orgType == 4)
	{
		return "Satire";
	} else if (orgType == 5)
	{
		return "Fake News";
	} else if (orgType == 6)
	{
		return "Non-Profit";
	} else if (orgType == 7)
	{
		return "FactChecker";
	} else {
		return "Unknown/Other";
	}
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
				return newsSource.Domain.endsWith("."+domain) || domain == newsSource.Domain;
			})[0];

			if (websiteResult != null)
			{
				currentWebsite = websiteResult;
				browser.browserAction.setTitle({
					title: getBiasText(websiteResult.Bias, websiteResult.OrganizationType),
					tabId: currentTab.id
				});
				updateIcon(websiteResult.Bias, websiteResult.OrganizationType);
				browser.browserAction.enable(currentTab.id);
			} 
		} 
	  }
    }
  }
	
  browser.tabs.query({active: true, currentWindow: true}, updateTab);
}

browser.storage.local.get(["websites","websitesUpdated"], onGotItems);

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

function onGotItems(item) {

  if (item != null && $.isEmptyObject(item) || item.length === 0)
  {
	  console.log("loading from web");
	  getSitePages();
  } else {
	  console.log("loading from storage");
	 
	  if (item.websites != null && item.websitesUpdated != null) 
	  {
			var tomorrow = new Date(item.websitesUpdated);
			tomorrow.setDate(tomorrow.getDate() + 1);

	       if (new Date() < tomorrow) {
				websites = item.websites;
			} else {
			 console.log("Storage expired, loading from web");
				getSitePages();
			}
	  } else {
		  getSitePages();
	  }
	  
  }

}

updateActiveTab();


