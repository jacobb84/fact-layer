if (browser)
{

	document.addEventListener('DOMContentLoaded', function () {
	    var bg = browser.extension.getBackgroundPage();
		
		$("#WebsiteCount").html(bg.websites.length);
		$("#FactCount").html(bg.factChecks.length);
		$("#FactMappingsCount").html(bg.factMappings.length);
		
		var gettingItem = browser.storage.local.get(["factChecksUpdated","websitesUpdated","factMappingsUpdated"]);
		gettingItem.then(onGotItems, onError);

		function onGotItems(item) {

		  if (!$.isEmptyObject(item))
		  {
			  $("#FactUpdated").html(getFormattedDate(item.factChecksUpdated));
			  $("#FactMappingsUpdated").html(getFormattedDate(item.factMappingsUpdated));
			  $("#WebsiteUpdated").html(getFormattedDate(item.websitesUpdated));
		  }

		}

		function onError(error) {
		  getFactPages();
		  getSitePages();
		  console.log('Error: ${error}');
		}
		
		
		$("#btnRefreshDatabase").on("click", function() {
			bg.getFactPages();
			bg.getSitePages();
			bg.getFactMappings();
			var target = document.getElementsByTagName('body')[0];
			var spinner = new Spinner().spin(target);
			$("#WebsiteCount").html("");
			$("#FactCount").html("");
			$("#FactMappingsCount").html("");
			$("#FactUpdated").html("");
			$("#WebsiteUpdated").html("");
			$("#FactMappingsUpdated").html("");
			
			var backgroundCheck = setInterval(function() {
				if (bg.websites.length != 0 && bg.factChecks.length != 0 && bg.factMappings.length != 0)
				{
					$("#WebsiteCount").html(bg.websites.length);
					$("#FactCount").html(bg.factChecks.length);
					$("#FactMappingsCount").html(bg.factMappings.length);
					$("#FactUpdated").html(getFormattedDate(new Date()));
					$("#WebsiteUpdated").html(getFormattedDate(new Date()));
					$("#FactMappingsUpdated").html(getFormattedDate(new Date()));
					spinner.stop();
					clearInterval(backgroundCheck);
				}
			}, 1000);
		});
	})
	
	function getFormattedDate(dateParam){
		
		console.log(dateParam);
		var d = new Date(dateParam);
		d = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2);

		return d;
	}
}