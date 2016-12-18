var factChecks = [];
var factMappings = [];
var currentTab = null;
var currentArticle= null;
var currentWebsite = null;
$("#btnFacts").on("click", function (e) {
	if (currentArticle == null)
	{
		$("#submitFactContainer").show();
	} else {
		$("#factContainer").show();
		$("#factListRefutedRow").empty();
		$("#factListSupportedRow").empty();
		for(var i = 0; i < currentArticle.RefutedBy.length; i++)
		{
			$("#factListRefutedRow").append('<button class="btn btn-block btn-flat btn-default left-text" data-title="'+currentArticle.RefutedBy[i]+'"  style="white-space: inherit ! important;">'+currentArticle.RefutedBy[i]+'<span class="pull-right"><span class="glyphicon glyphicon-triangle-right"></span></span></button>');
		}
		for(var i = 0; i < currentArticle.SupportedBy.length; i++)
		{
			$("#factListSupportedRow").append('<button class="btn btn-block btn-flat btn-default left-text" data-title="'+currentArticle.SupportedBy[i]+'"  style="white-space: inherit ! important;">'+currentArticle.SupportedBy[i]+'<span class="pull-right"><span class="glyphicon glyphicon-triangle-right"></span></span></button>');
		}
		
		$("#factListRefutedRow button, #factListSupportedRow button").on("click", function () {
			var factTitle = $(this).data("title");
			var factCheck = factChecks.filter(function (fact) {
				return factTitle == fact.Name;
			})[0];
			
			for(var i = 0; i < factCheck.Sources.length; i++)
			{
				var source = factCheck.Sources[i];
				$('#factSourceTable tbody').append('<tr><td>'+source.Name+'</td><td><a target="_blank" href="'+source.URL+'">'+source.Title+'</a></td><td>'+source.Rated+'</td></tr>');
				$("#factSourceTable tbody a").on("click", function(e)
				{
					setTimeout(function() {
						window.close();
					},1);
				});
			}
			
			$("#factContainer").hide();
			$("#factSourceContainer").show();
		});
	}
	$("#mainContainer").hide();

});

$("#btnSubmitFact").on("click", function (e) {
	var errorMsg = "";
	var factCheck = factChecks.filter(function (fact) {
		return $("#factCollection").val() == fact.Name;
	})[0];
	if ($("#factCollection").val() == '')
	{
		errorMsg += "You must select a fact collection.<br />";
	} 
	else if (factCheck == null)
	{
		errorMsg += "The fact collection you entered does not exist.<br />";
	}
	
	if (!$("#supportedBy").is(":checked") && !$("#refutedBy").is(":checked"))
	{
		errorMsg += "You must say whether the fact collection supports or refutes the current webpage.<br />";
	}
	
	if (errorMsg != '')
	{
		$("#submitFactContainer div.alert").addClass("alert-danger");
		$("#submitFactContainer div.alert").html(errorMsg);
		$("#submitFactContainer div.alert").show();
		e.preventDefault();
	} else {
		$("#submitFactContainer div.alert").hide();
		//Add locally first
		var factMapping = {
			URL: currentTab.url.toLowerCase(),
			SupportedBy: [],
			RefutedBy: []
		}
		
		if ($("#supportedBy").is(":checked"))
		{
			factMapping.SupportedBy.push($("#factCollection").val());
		} else {
			factMapping.RefutedBy.push($("#factCollection").val());
		}
		
		factMappings.push(factMapping);
		
		//Now send to server		
		var csrfToken = "";
		  $.ajax({
			url: 'http://factlayer.referata.com/w/api.php?action=query&meta=tokens&format=json',
			type: 'GET',
			success: function (returndata) {
			  csrfToken = returndata.query.tokens.csrftoken;
			  continueWithToken (csrfToken )
			}
		  });
	}
	return false;
});

function continueWithToken(csrfToken)
{
	var template = '{{News Article|Title=##TITLE##|URL=##URL##|Listed On=##LISTEDON##}}{{Supported By|Supported By=##SUPPORTEDBY##}}{{Refuted By|Refuted By=##REFUTEDBY##}}';
	template = template.replace("##TITLE##",currentTab.title);
	template = template.replace("##URL##",currentTab.url.toLowerCase());
	template = template.replace("##LISTEDON##",currentWebsite.Name);
	if ($("#supportedBy").is(":checked"))
	{
		template = template.replace("##SUPPORTEDBY##",$("#factCollection").val());
		template = template.replace("##REFUTEDBY##",'');
	} 
	else if ($("#refutedBy").is(":checked")) 
	{
		template = template.replace("##SUPPORTEDBY##",'');
		template = template.replace("##REFUTEDBY##",$("#factCollection").val());
	}
	
	var api = 'http://factlayer.referata.com/w/api.php?action=edit&format=json&title='+currentTab.title + " (" + currentWebsite.Name + ")"+'&basetimestamp='+new Date();
	$.post(api,{ token: csrfToken, text: template})
	  .done(function( data ) {
		$("#submitFactContainer div.alert").removeClass("alert-danger");
		$("#submitFactContainer div.alert").addClass("alert-success");
		$("#submitFactContainer div.alert").html("Submission received!");
		$("#submitFactContainer div.alert").show();
	});
}

$("#btnBias").on("click", function (e) {
	$("#biasContainer").show();
	$("#mainContainer").hide();
});


$(".btnBack").on("click", function (e) {
	$("div.container").hide();
	$("#mainContainer").show();
});


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
				$("#DescWell").html(currentWebsite.Description);
			} else {
				$("#DescWell").html("Sorry, no description is available for this site.");
			}
			$(".title").html(currentWebsite.Name);
			$("#biasSpan").html("Bias: "+currentWebsite.Bias.Rating);

			for (var i = 0, len = currentWebsite.Bias.Sources.length; i < len; i++) {
			  var src = currentWebsite.Bias.Sources[i];
			  $('#biasSourceTable tbody').append('<tr><td><a target="_blank" href="'+src.URL+'">'+src.Name+'</a></td><td>'+src.Bias+'</td></tr>');
			}
			$("#biasSourceTable tbody a").on("click", function(e)
			{
				setTimeout(function() {
					window.close();
				},1);
			});
			
			
			$( "#factCollection" ).autocomplete({
			  minLength: 0,
			  source: function (request, response) {
				var re = $.ui.autocomplete.escapeRegex(request.term);
				var matcher = new RegExp(re, "i");
				response($.grep(($.map(factChecks, function (v, i) {

						return {
							label: v.Name,
							value: v.Name
						};
					})), function (item) {
						return matcher.test(item.value);
					}))

				}
			});

		} else {
			$("#DescWell").html("Sorry, no information is available for this site.");
			$("#biasRow").hide();
			$("#factRow").hide();
		}
    }
  }

  if (browser){
	var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
	gettingActiveTab.then(updateTab);
  }


}

if (browser)
{

	document.addEventListener('DOMContentLoaded', function () {
	    var bg = browser.extension.getBackgroundPage();
		factChecks = bg.factChecks;
		factMappings = bg.factMappings;
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

