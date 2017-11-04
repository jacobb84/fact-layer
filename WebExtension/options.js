//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

if (browser)
{

	document.addEventListener('DOMContentLoaded', function () {
	    var bg = browser.extension.getBackgroundPage();
		
		$("#WebsiteCount").html(bg.websites.length);
		$("#AliasesCount").html(bg.aliasDomains.length);
		$("#FactMappingsCount").html(bg.factMappings.length);
		$("#FactPacksCount").html(bg.factPacks.length);
		browser.storage.local.get(["websitesUpdated", "aliasesUpdated", "factMappingsUpdated", "factPacksUpdated"], onGotItems);

		
		function onGotItems(item) {

		  if (!$.isEmptyObject(item))
		  {
			  $("#WebsiteUpdated").html(getFormattedDate(item.websitesUpdated));
			  $("#AliasesUpdated").html(getFormattedDate(item.aliasesUpdated));
			  $("#FactMappingsUpdated").html(getFormattedDate(item.factMappingsUpdated));
			  $("#FactPacksUpdated").html(getFormattedDate(item.factPacksUpdated));
		  }

		}		
		
		$("#btnRefreshDatabase").on("click", function() {;
			bg.getSitePages();
			bg.getAliases();
			bg.getFactMappings();
			bg.getFactPacks();
			bg.getFactPacks();
			getRegexSitePages();
			var target = document.getElementsByTagName('body')[0];
			var spinner = new Spinner().spin(target);
			$("#WebsiteCount").html("");
			$("#WebsiteUpdated").html("");
			$("#AliasesCount").html("");
			$("#AliasesUpdated").html("");
			$("#FactMappingsCount").html("");
			$("#FactMappingsUpdated").html("");
			$("#FactPacksCount").html("");
			$("#FactPacksUpdated").html("");
			var backgroundCheck = setInterval(function() {
				if (bg.websites.length != 0 && bg.aliasDomains.length != 0 && bg.factMappings.length != 0 && bg.factPacks.length != 0)
				{
					$("#WebsiteCount").html(bg.websites.length);
					$("#WebsiteUpdated").html(getFormattedDate(new Date()));
					$("#AliasesCount").html(bg.aliasDomains.length);
					$("#AliasesUpdated").html(getFormattedDate(new Date()));
					$("#FactMappingsCount").html(bg.factMappings.length);
					$("#FactMappingsUpdated").html(getFormattedDate(new Date()));
					$("#FactPacksCount").html(bg.factPacks.length);
					$("#FactPacksUpdated").html(getFormattedDate(new Date()));
					spinner.stop();
					clearInterval(backgroundCheck);
				}
			}, 1000);
		});
	})
	
	function getFormattedDate(dateParam){
		
		var d = new Date(dateParam);
		d = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2);

		return d;
	}
}