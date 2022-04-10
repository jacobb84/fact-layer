let currentTab = null;
let currentArticle = null;
let currentWebsite = null;
let bg = null;
//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

function resetContainer() {
    document.querySelectorAll("div.container").forEach((container) => {
        container.style.display = 'none';
    });
}

function createLink(url, text) {
    let a = document.createElement("a");
    let aText = document.createTextNode(text);
    a.appendChild(aText);
    a.target = "_blank";
    a.href = url;
    a.addEventListener("click", function (e) {
        resetContainer();
        document.querySelector("#mainContainer").style.display = 'block';
        setTimeout(function () {
            window.close();
        }, 1);

        return true;
    });

    return a;
}

function getSourcesByType(type) {
    let sources = currentWebsite.Sources.filter(function (src) {
        return src.ClaimType == type;
    });

    let tbody = document.querySelector('#sourceTable tbody');
    for (let i = 0, len = sources.length; i < len; i++) {
        let src = sources[i];
        let tr = document.createElement("tr");
        let orgtd = document.createElement("td");
        let a = createLink(src.URL, bg.FactLayerUtilities.getSourceOrgName(src.Organization));
        orgtd.appendChild(a);
        let ratingtd = document.createElement("td");
        if (src.ClaimType == 0) {
            let ratingText = document.createTextNode(bg.FactLayerUtilities.getBiasText(src.ClaimValue));
            ratingtd.appendChild(ratingText);
        } else if (src.ClaimType == 1 || src.ClaimType == 4) {
            let ratingText = document.createTextNode(bg.FactLayerUtilities.getOrgTypeText(src.ClaimValue));
            ratingtd.appendChild(ratingText);
        }
        tr.appendChild(orgtd);
        tr.appendChild(ratingtd);
        tbody.appendChild(tr);
    }

}

document.addEventListener("click", function (e) {
    if (e.target.matches("#btnBias, #btnVeracity, #btnOrgType, #btnBias span, #btnVeracity span, #btnOrgType span")) {
        resetContainer();
        document.querySelector("#sourceContainer").style.display = 'block';
        let new_tbody = document.createElement('tbody');
        let old_tbody = document.querySelector('#sourceTable tbody');
        old_tbody.parentNode.replaceChild(new_tbody, old_tbody)
        if (e.target.matches("#btnBias, #btnVeracity, #btnOrgType")) {
            getSourcesByType(e.target.dataset.type);
        } else if (e.target.matches("#btnBias > span, #btnVeracity > span, #btnOrgType > span")) {
            getSourcesByType(e.target.parentElement.dataset.type);
        } else {
            getSourcesByType(e.target.parentElement.parentElement.dataset.type);
        }

    }
});

document.addEventListener("click", function (e) {
    if (e.target.matches("#btnFacts")) {
        resetContainer();
        document.querySelector("#factContainer").style.display = 'block';
        let refutedRows = document.querySelector("#factListRefutedRows");
        refutedRows.textContent = "";
        for (let i = 0; i < currentArticle.RefutedBy.length; i++) {
            let factRow = document.createElement("div");
            let h5 = document.createElement("h5");
            let factButton = document.createElement("button");
            factRow.className = "fact-row";
            factRow.dataset.id = currentArticle.RefutedBy[i];
            let iTag = document.createElement("i");
            let titleText = document.createTextNode(factPack.Claim);
            iTag.appendChild(titleText);
            h5.appendChild(iTag);
            factButton.className = "btn btn-block btn-flat btn-default left-text";
            factButton.style = "white-space: inherit ! important;";
            let buttonText = document.createTextNode("Rating: " + factPack.Rating);
            let span1 = document.createElement("span");
            span1.className = "pull-right";
            let span2 = document.createElement("span");
            span2.className = "glyphicon glyphicon-triangle-right";
            span1.appendChild(span2);
            let factPack = bg.storage.factPacks.filter(function (pack) {
                return pack.ID == factRow.dataset.id;
            })[0];
            factButton.appendChild(buttonText);
            factButton.appendChild(span1);
            factButton.addEventListener("click", function (e) {
                let new_tbody = document.createElement('tbody');
                let old_tbody = document.querySelector('#factSourceTable tbody');
                old_tbody.parentNode.replaceChild(new_tbody, old_tbody)
                factPack.Sources.forEach(function (src) {
                    let factSourceTable = document.querySelector('#factSourceTable tbody');
                    let tr = document.createElement("tr");
                    let orgtd = document.createElement("td");
                    let a = createLink(src.URL, src.Organization);
                    orgtd.appendChild(a);
                    let ratingtd = document.createElement("td");
                    let ratingText = document.createTextNode(getSourceClaimText(src.ClaimValue));
                    ratingtd.appendChild(ratingText);
                    tr.appendChild(orgtd);
                    tr.appendChild(ratingtd);
                    factSourceTable.appendChild(tr);
                });

                document.querySelector('#factContainer').style.display = 'none';
                document.querySelector('#factSourceContainer').style.display = 'block';
            });
            factRow.appendChild(h5);
            factRow.appendChild(factButton);
            document.querySelector('#factListRefutedRows').appendChild(factRow);
        }
    }
});

document.addEventListener("click", function (e) {
    if (e.target.matches(".btnBack")) {
        resetContainer();
        document.querySelector("#mainContainer").style.display = 'block';
    }
});

document.addEventListener("click", function (e) {
    if (e.target.matches("#btnBackFacts")) {
        document.querySelector("#factContainer").style.display = 'block';
        document.querySelector("#factSourceContainer").style.display = 'block';
    }
});

/*
 * Switches currentTab and factcheck to reflect the currently active tab
 */
function updateActiveTab(tabs) {

    function updateTab(tabs) {
        currentTab = null;
        if (browser.runtime.lastError) {
            window.setTimeout(() => updateActiveTab(), 100);
        }
        if (tabs && tabs[0]) {
            currentTab = tabs[0];
            let descWell = document.querySelector("#DescWell");
            if (currentWebsite != null) {
                document.querySelector("#sourceRow").style.display = 'block';
                if (currentWebsite.Description != null) {
                    descWell.textContent = currentWebsite.Description;
                    if (currentWebsite.Wikipedia != null) {
                        let br = document.createElement("br");
                        let a = createLink(currentWebsite.Wikipedia, "Read More");
                        descWell.appendChild(br);
                        descWell.appendChild(br);
                        descWell.appendChild(a);
                    }
                } else {
                    descWell.textContent = "Sorry, no description is available for this site.";
                }
                document.querySelector(".title").textContent = currentWebsite.Name;
                document.querySelector(".orgType").textContent = bg.FactLayerUtilities.getOrgTypeText(currentWebsite.OrganizationType);
                document.querySelector("#siteTypeIcon").src = '../icons/' + bg.FactLayerUtilities.getIconImage(currentWebsite.OrganizationType) + '.png';
                document.querySelector("#biasSpan").textContent = "Bias: " + bg.FactLayerUtilities.getBiasText(bg.FactLayerUtilities.getOverallBias(currentWebsite.Sources));
                document.querySelector("#veracitySpan").textContent = "Veracity: " + bg.FactLayerUtilities.getOrgTypeText(currentWebsite.OrganizationType);

                for (let i = 0, len = currentWebsite.Sources.length; i < len; i++) {
                    let src = currentWebsite.Sources[i];
                    if (src.ClaimType == 0) {
                        document.querySelector("#btnBias").style.display = 'block';
                    } else if (src.ClaimType == 1) {
                        document.querySelector("#btnVeracity").style.display = 'block';
                    } else if (src.ClaimType == 4) {
                        let orgTypeSpan = document.querySelector("#orgTypeSpan");
                        orgTypeSpan.textContent = "Organization: " + bg.FactLayerUtilities.getOrgTypeText(src.ClaimValue);
                        document.querySelector("#btnOrgType").style.display = 'block';
                    } else if (src.ClaimType == 2) {
                        let charitySpan = document.querySelector("#charitySpan");
                        let suffix = document.createTextNode("By Charity Navigator");
                        let img = document.createElement("img");
                        img.src = "https://d20umu42aunjpx.cloudfront.net/_gfx_/icons/stars/" + src.ClaimValue + "stars.png";
                        charitySpan.textContent = "Rating: ";
                        charitySpan.appendChild(img);
                        charitySpan.appendChild(suffix);
                        let btnCharity = document.querySelector("#btnCharity");
                        btnCharity.style.display = 'block';
                        $("#btnCharity").addEventListener("click", function (e) {
                            setTimeout(function () {
                                window.open("https://www.charitynavigator.org/index.cfm?bay=search.summary&orgid=" + src.URL, '_blank');
                            }, 1);
                            return true;
                        });
                    }
                }

                if (currentArticle != null) {
                    document.querySelector("#btnFacts").style.display = 'block';
                }

                descWell.querySelectorAll("a").forEach((aTag) => {
                    aTag.addEventListener("click", function (e) {
                        setTimeout(function () {
                            window.close();
                        }, 1);

                        return true;
                    });
                });
            } else {
                descWell.textContent = "Sorry, no information is available for this site.";
                document.querySelector("#sourceRow").style.display = 'none';
            }
        }
    }

    browser.tabs.query({active: true, currentWindow: true}, updateTab);
}

function getSourceClaimText(claimId) {
    if (claimId == 0) {
        return "False";
    } else if (claimId == 1) {
        return "True";
    } else if (claimId == 2) {
        return "Unproven";
    } else if (claimId == 3) {
        return "Mixture";
    } else if (claimId == 4) {
        return "Miscaptioned";
    } else if (claimId == 5) {
        return "Mostly False";
    }

    return "N/A";
}

if (browser) {

    document.addEventListener('DOMContentLoaded', function () {
        bg = browser.extension.getBackgroundPage();
        currentWebsite = bg.getCurrentWebsite();
        currentArticle = bg.getCurrentArticle();
        // listen to tab URL changes
        browser.tabs.onUpdated.addListener(updateActiveTab);

        // listen to tab switching
        browser.tabs.onActivated.addListener(updateActiveTab);

        // update when the extension loads initially
        updateActiveTab();

    })
}

