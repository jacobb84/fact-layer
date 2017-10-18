var isChrome = false;
//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
	isChrome = true;
}

if (browser)
{

	document.addEventListener('DOMContentLoaded', function () {
	    var bg = browser.extension.getBackgroundPage();
		
		$("#WebsiteCount").html(bg.websites.length);
		

		browser.storage.local.get("websitesUpdated", onGotItems);

		
		function onGotItems(item) {

		  if (!$.isEmptyObject(item))
		  {
			  $("#WebsiteUpdated").html(getFormattedDate(item.websitesUpdated));
		  }

		}		
		
		$("#btnRefreshDatabase").on("click", function() {;
			bg.getSitePages();
			var target = document.getElementsByTagName('body')[0];
			var spinner = new Spinner().spin(target);
			$("#WebsiteCount").html("");
			$("#WebsiteUpdated").html("");
			
			var backgroundCheck = setInterval(function() {
				if (bg.websites.length != 0)
				{
					$("#WebsiteCount").html(bg.websites.length);
					$("#WebsiteUpdated").html(getFormattedDate(new Date()));
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