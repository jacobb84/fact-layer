var currentTab = null;
var currentArticle= null;
var currentWebsite = null;
var bg = null;
var isChrome = false;
//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
	isChrome = true;
}

$("#btnBias").on("click", function (e) {
	$("#biasContainer").show();
	$("#mainContainer").hide();
});


$(".btnBack").on("click", function (e) {
	$("div.container").hide();
	$("#mainContainer").show();
});

/*
 * Switches currentTab and factcheck to reflect the currently active tab
 */
function updateActiveTab(tabs) {

  function updateTab(tabs) {
	  currentTab = null;
	  
    if (tabs[0]) {
		currentTab = tabs[0];
		$('#biasSourceTable tbody').empty();
		$('#factSourceTable tbody').empty();
	
			
		if (currentWebsite != null)
		{
			$("#biasRow").show();
			$("#factRow").show();
			if (currentWebsite.Description != null)
			{
				$("#DescWell").html(currentWebsite.Description + "<br /><br /><a target=\"_blank\" href=\""+currentWebsite.Wikipedia+"\">Read More</a>");
			} else {
				$("#DescWell").html("Sorry, no description is available for this site.");
			}
			$(".title").html(currentWebsite.Name);
			$(".orgType").html(bg.getOrgType(currentWebsite.OrganizationType));
			$("#biasSpan").html("Bias: "+bg.getBiasText(currentWebsite.Bias));

			for (var i = 0, len = currentWebsite.Sources.length; i < len; i++) {
			  var src = currentWebsite.Sources[i];
			  if (src.ClaimType == 0)
			  {
				  $('#biasSourceTable tbody').append('<tr><td><a target="_blank" href="'+src.URL+'">'+src.Organization+'</a></td><td>'+bg.getBiasText(src.ClaimValue)+'</td></tr>');
			  }
			  
			}
			$("#biasSourceTable tbody a").on("click", function(e)
			{
				setTimeout(function() {
					window.close();
				},1);
			});

		} else {
			$("#DescWell").html("Sorry, no information is available for this site.");
			$("#biasRow").hide();
			$("#factRow").hide();
		}
    }
  }

  if (browser){
	
	var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true}, updateTab);
  }


}

if (browser)
{

	document.addEventListener('DOMContentLoaded', function () {
	    bg = browser.extension.getBackgroundPage();
		currentWebsite = bg.currentWebsite;
		currentArticle = bg.currentArticle;
		// listen to tab URL changes
		browser.tabs.onUpdated.addListener(updateActiveTab);

		// listen to tab switching
		browser.tabs.onActivated.addListener(updateActiveTab);

		// update when the extension loads initially
		updateActiveTab();

	})
}

