var currentTab = null;
var currentArticle= null;
var currentWebsite = null;
var bg = null;
//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

function getSourcesByType(type)
{
	var sources = currentWebsite.Sources.filter(function (src) {
		return src.ClaimType == type;
	});
	
	for (var i = 0, len = sources.length; i < len; i++) {
	  var src = sources[i];
	  if (src.ClaimType == 0)
	  {
		  $('#sourceTable tbody').append('<tr><td><a target="_blank" href="'+src.URL+'">'+bg.getSourceOrgName(src.Organization)+'</a></td><td>'+bg.getBiasText(src.ClaimValue)+'</td></tr>');
	  }
	  else if (src.ClaimType == 1 || src.ClaimType == 4)
	  {
		  $('#sourceTable tbody').append('<tr><td><a target="_blank" href="'+src.URL+'">'+bg.getSourceOrgName(src.Organization)+'</a></td><td>'+bg.getOrgType(src.ClaimValue)+'</td></tr>');
	  }
	}
}

$("#btnBias, #btnVeracity, #btnOrgType").on("click", function (e) {
	$("div.container").hide();
	$("#sourceContainer").show();
	$('#sourceTable tbody').empty();
	getSourcesByType($(this).data("type"));
});

$("#btnFacts").on("click", function (e) {
	$("div.container").hide();

	$("#factContainer").show();
	$("#factListRefutedRows").empty();
	for(var i = 0; i < currentArticle.RefutedBy.length; i++)
	{
		$("#factListRefutedRows").append('<div class="fact-row" data-id="'+currentArticle.RefutedBy[i]+'" ><h5></h5><button class="btn btn-block btn-flat btn-default left-text"  style="white-space: inherit ! important;"><span class="pull-right"><span class="glyphicon glyphicon-triangle-right"></span></span></button></div>');
	}
	
	$("#factListRefutedRows div.fact-row").each(function(index, obj) {
		var factPack = bg.factPacks.filter(function (pack) {
				return pack.ID == $(obj).data("id");
			})[0];
		var factSourceButton = $(this).find("button");
		$(this).find("h5").html("<i>"+factPack.Claim+"</i>");
		$(factSourceButton).html("Rating: " + factPack.Rating + $(factSourceButton).html());	
		$(factSourceButton).on("click", function () {
			$('#factSourceTable tbody').empty();
			factPack.Sources.forEach(function(src) {				  
				$('#factSourceTable tbody').append('<tr><td><a target="_blank" href="'+src.URL+'">'+src.Organization+'</a></td><td>' + (src.ClaimValue == "0" ? "False" : "True") +'</td></tr>');
			});
			
			$("#factSourceTable tbody a").on("click", function(e)
				{
					setTimeout(function() {
						window.close();
					},1);
				});

			$("#factContainer").hide();
			$("#factSourceContainer").show();
		});
	});
});

$(".btnBack").on("click", function (e) {
	$("div.container").hide();
	$("#mainContainer").show();
});

$("#btnBackFacts").on("click", function (e) {
	$("#factContainer").show();
	$("#factSourceContainer").hide();
})


/*
 * Switches currentTab and factcheck to reflect the currently active tab
 */
function updateActiveTab(tabs) {

  function updateTab(tabs) {
	  currentTab = null;
	  
    if (tabs[0]) {
		currentTab = tabs[0];
		$('#biasSourceTable tbody').empty();
		$('#veracitySourceTable tbody').empty();
	
			
		if (currentWebsite != null)
		{
			$("#sourceRow").show();
			if (currentWebsite.Description != null)
			{
				$("#DescWell").html(currentWebsite.Description);
				if (currentWebsite.Wikipedia != null)
				{
					$("#DescWell").html($("#DescWell").html()+"<br /><br /><a target=\"_blank\" href=\""+currentWebsite.Wikipedia+"\">Read More</a>");
				}
			} else {
				$("#DescWell").html("Sorry, no description is available for this site.");
			}
			$(".title").html(currentWebsite.Name);
			$(".orgType").html(bg.getOrgType(currentWebsite.OrganizationType));
			$("#siteTypeIcon").attr("src", '../icons/' + bg.getIconImage(currentWebsite.OrganizationType) + '.png');
			$("#biasSpan").html("Bias: "+bg.getBiasText(bg.getOverallBias(currentWebsite.Sources)));
			$("#veracitySpan").html("Veracity: "+bg.getOrgType(currentWebsite.OrganizationType));
			
			for (var i = 0, len = currentWebsite.Sources.length; i < len; i++) {
			  var src = currentWebsite.Sources[i];
			  if (src.ClaimType == 0)
			  {
				  $('#btnBias').show();
			  }
			  else if (src.ClaimType == 1)
			  {
				  $('#btnVeracity').show();
			  }
			  else if (src.ClaimType == 4)
			  {
				  $("#orgTypeSpan").html("Organization: "+bg.getOrgType(src.ClaimValue));
				  $('#btnOrgType').show();
			  }
			  else if (src.ClaimType == 2)
			  {
				$("#charitySpan").html("Rating: <img src='https://d20umu42aunjpx.cloudfront.net/_gfx_/icons/stars/"+src.ClaimValue+"stars.png' /> by By Charity Navigator");   
				$('#btnCharity').show();
				$("#btnCharity").on("click", function(e)
				{
					setTimeout(function() {
						window.open("https://www.charitynavigator.org/index.cfm?bay=search.summary&orgid="+src.URL, '_blank');
					},1);
				});

			  }
			  
			}
	
			if (currentArticle != null)
			{
				$('#btnFacts').show();
			}
			
			$("#biasSourceTable tbody a, #btnCharity, #veracitySourceTable tbody a, #DescWell a").on("click", function(e)
			{
				setTimeout(function() {
					window.close();
				},1);
			});

		} else {
			$("#DescWell").html("Sorry, no information is available for this site.");
			$("#sourceRow").hide();
			
		}
    }
  }


   var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true}, updateTab);



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

