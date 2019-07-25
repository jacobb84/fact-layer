//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

if (browser)
{

	document.addEventListener('DOMContentLoaded', function () {
	    var bg = browser.extension.getBackgroundPage();
		
		if (bg.storage.websites != null)
		{
			$("#WebsiteCount").html(bg.storage.websites.length);
		} else {
			$("#WebsiteCount").html(0);
		}
		
		if (bg.storage.aliases != null)
		{
			$("#AliasesCount").html(bg.storage.aliases.length);
		} else {
			$("#AliasesCount").html(0);
		}
		
		if (bg.storage.factMappings != null)
		{
			$("#FactMappingsCount").html(bg.storage.factMappings.length);
		} else {
			$("#FactMappingsCount").html(0);
		}
		
		if (bg.storage.factPacks != null)
		{
			$("#FactPacksCount").html(bg.storage.factPacks.length);
		} else {
			$("#FactPacksCount").html(0);
		}
		
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
			bg.getTimestamps();
			bg.getSitePages();
			bg.getAliases();
			bg.getFactMappings();
			bg.getFactPacks();
			bg.getFactPacks();
			bg.getRegexSitePages();
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
				if (bg.storage.websites.length != 0 && bg.storage.aliases.length != 0 && bg.storage.factMappings.length != 0 && bg.storage.factPacks.length != 0)
				{
					$("#WebsiteCount").html(bg.storage.websites.length);
					$("#WebsiteUpdated").html(getFormattedDate(bg.storage.timestamps.websites));
					$("#AliasesCount").html(bg.storage.aliases.length);
					$("#AliasesUpdated").html(getFormattedDate(bg.storage.timestamps.aliases));
					$("#FactMappingsCount").html(bg.storage.factMappings.length);
					$("#FactMappingsUpdated").html(getFormattedDate(bg.storage.timestamps.factMappings));
					$("#FactPacksCount").html(bg.storage.factPacks.length);
					$("#FactPacksUpdated").html(getFormattedDate(bg.storage.timestamps.factPacks));
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