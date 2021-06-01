//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

var orgSiteVersion = "1.3";
var aliasVersion = "1.0";
var factMappingsVersion = "1.0";
var factPacksVersion = "1.0";
var regOrgSiteVersion = "1.0";
var currentTab;
var manifest = browser.runtime.getManifest();
var currentTabUrl = "";
var currentWebsite = null;
var currentArticle = null;

var storage = {
    websites: [],
    websitesNameIndex: [],
    regexWebsites: [],
    aliases: [],
    factMappings: [],
    factPacks: [],
    timestamps: {}
}

var settings = {
    extremeLeftColor: "#0000FF",
    leftColor: "#2E65A1",
    leftCenterColor: "#9DC8EB",
    centerColor: "#8D698D",
    rightCenterColor: "#CDA59C",
    rightColor: "#A52A2A",
    extremeRightColor: "#FF0000",
    satireColor: "#007F0E"
}

function getWebsiteByDomain(domain) {
    domain = domain.replace(/^(www|amp|m|mobile)\./g, "");
    //See if this is an alias
    var aliasDomain = storage.aliases.find(function (newsSource) {
        return domain.endsWith(newsSource.alias);
    });


    if (aliasDomain) {
        domain = aliasDomain.host;
    }

    return FactLayerUtilities.binarySearchByDomain(storage.websites, domain);
}

function getWebsiteByName(name) {
    var result = FactLayerUtilities.binarySearchByName(storage.websitesNameIndex, name);
    if (result) {
        var website = storage.websites[result.RowIndex];

        return website;
    }

    return null;
}

function updateTimestampsIfNeeded(browserStorage, storageUpdated) {
    if (browserStorage != null && storageUpdated != null) {
        var tomorrow = new Date(storageUpdated);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (storageUpdated < tomorrow) {
            storage.timestamps = browserStorage;
        } else {
            getTimestamps();
        }

    } else {
        getTimestamps();
    }
}

function updateStorageIfNeeded(browserStorage, storageUpdated, storageProperty, globalUpdateFunction) {
    if (browserStorage != null && storageUpdated != null) {
        if (storageUpdated < storage.timestamps[storageProperty]) {
            globalUpdateFunction();
        } else {
            storage[storageProperty] = browserStorage;
        }

    } else {
        globalUpdateFunction();
    }
}

function getJsonFile(url, storageProperty) {
    storage[storageProperty] = [];
    var api = url + "?cachebust=" + new Date().getTime();
    $.ajax({
        url: api,
        type: 'GET',
        success: function (returndata) {
            storage[storageProperty] = returndata;
            var browserStorage = {};
            browserStorage[storageProperty] = returndata;
            browserStorage[storageProperty + "Updated"] = storage.timestamps[storageProperty];
            browser.storage.local.set(browserStorage);
        }
    });
}

function getTimestamps() {
    storage.timestamps = {};
    var api = "http://factlayer.azurewebsites.net/timestamps.json?cachebust=" + new Date().getTime();
    $.ajax({
        url: api,
        type: 'GET',
        success: function (returndata) {
            storage.timestamps = returndata;
            var browserStorage = {};
            browserStorage["timestamps"] = returndata;
            browserStorage["timestampsUpdated"] = new Date();
            browser.storage.local.set(browserStorage);
        }
    });
}

function getSitePages() {
    getJsonFile("http://factlayer.azurewebsites.net/org_sites." + orgSiteVersion + ".json", "websites");
}

function getRegexSitePages() {
    getJsonFile("http://factlayer.azurewebsites.net/org.sites.regex." + regOrgSiteVersion + ".json", "regexWebsites");
}

function getAliases() {
    getJsonFile("http://factlayer.azurewebsites.net/aliases." + aliasVersion + ".json", "aliases");
}

function getFactMappings() {
    getJsonFile("http://factlayer.azurewebsites.net/fact.mappings." + factMappingsVersion + ".json", "factMappings");
}

function getFactPacks() {
    getJsonFile("http://factlayer.azurewebsites.net/fact.packs." + factPacksVersion + ".json", "factPacks");
}

/*
 * Updates the browserAction icon to reflect the information of the current page.
 */
function updateIcon(bias, orgType) {
    var iconColor = FactLayerUtilities.getBiasColor(bias, orgType);
    var iconImage = FactLayerUtilities.getIconImage(orgType);

    var img = new Image();
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d", {alpha: false});
    img.src = 'icons/' + iconImage + '.png';
    img.onload = function () {
        ctx.clearRect(0, 0, 72, 72);
        ctx.fillStyle = iconColor;
        ctx.fillRect(0, 0, 72, 72);
        ctx.drawImage(img, 4, 4);

        browser.browserAction.setIcon({
            imageData: ctx.getImageData(0, 0, 72, 72),
            tabId: currentTab.id
        });
    };
}

function getIconText(bias, orgType) {

    if (orgType == 4 || orgType == 5 || orgType == 8 || orgType == 9) {
        return FactLayerUtilities.getOrgTypeText(orgType);
    }

    return FactLayerUtilities.getBiasText(bias);
}

function getRegexWebsite(domain) {
    domain = domain.replace(/^(www|amp|m|mobile)\./g, "");
    var websiteResult = storage.regexWebsites.find(function (site) {
        var regex = new RegExp(site.Domain, 'gi');
        var isMatch = regex.test(domain);
        return isMatch;
    });
    return websiteResult;
}

function saveSettings() {
    var browserStorage = {};
    browserStorage["settings"] = settings;
    browser.storage.local.set(browserStorage);
}

/*
 * Switches currentTab and factcheck to reflect the currently active tab
 */
function updateActiveTab(tabId, changeInfo, tabInfo) {

    function updateTab(tabs) {
        if (tabs[0]) {
            currentTab = tabs[0];
            if (currentTab.url != null && (currentTab.url != currentTabUrl || (typeof (changeInfo) != "undefined" && changeInfo.status == "loading"))) {
                currentTabUrl = currentTab.url;
                currentWebsite = null;
                currentArticle = null;
                browser.browserAction.setBadgeText({
                    text: "",
                    tabId: currentTab.id
                });

                updateIcon();
                browser.browserAction.disable(currentTab.id);

                var managedUrl = new URL(currentTab.url);
                var path = managedUrl.pathname + managedUrl.search;

                var websiteResult = getWebsiteByDomain(managedUrl.hostname);
                if (websiteResult == null) {
                    websiteResult = getRegexWebsite(managedUrl.hostname)
                }
                if (websiteResult != null) {
                    currentWebsite = websiteResult;
                    var totalBias = FactLayerUtilities.getOverallBias(websiteResult.Sources);
                    browser.browserAction.setTitle({
                        title: getIconText(totalBias, websiteResult.OrganizationType),
                        tabId: currentTab.id
                    });
                    updateIcon(totalBias, websiteResult.OrganizationType);
                    browser.browserAction.enable(currentTab.id);

                    var factResultDomain = storage.factMappings.find(function (mapping) {
                        return mapping.Domain == websiteResult.Domain;
                    });

                    if (factResultDomain != null) {
                        var factResultPage = factResultDomain.Pages.find(function (page) {
                            return page.Path == path;
                        });

                        if (factResultPage != null) {
                            currentArticle = factResultPage;
                            if (factResultPage.RefutedBy.length > 0) {
                                browser.browserAction.setBadgeBackgroundColor({
                                    color: "#d6150e",
                                    tabId: currentTab.id
                                });

                                browser.browserAction.setBadgeText({
                                    text: factResultPage.RefutedBy.length.toString(),
                                    tabId: currentTab.id
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    browser.tabs.query({active: true, currentWindow: true}, updateTab);
}

browser.storage.local.get(["regexWebsites", "regexWebsitesUpdated", "websites", "websitesUpdated", "installedVersion", "aliases", "aliasesUpdated", "factMappings", "factMappingsUpdated", "factPacks", "factPacksUpdated", "timestamps", "timestampsUpdated"], onGotItems);
browser.storage.local.get(["settings"], onLoadSettings);
// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

function onLoadSettings(item) {
    if (item != null && !($.isEmptyObject(item) || item.length === 0)) {
        settings = item.settings;
    }

}

function onGotItems(item) {
    if (item != null && $.isEmptyObject(item) || item.length === 0) {
        getTimestamps();
        getSitePages();
        getAliases();
        getFactMappings();
        getFactPacks();
        getRegexSitePages();
        browser.storage.local.set({
            installedVersion: manifest.version
        });
    } else {
        updateTimestampsIfNeeded(item.timestamps, item.timestampsUpdated);
        updateStorageIfNeeded(item.websites, item.websitesUpdated, "websites", getSitePages);
        updateStorageIfNeeded(item.aliases, item.aliasesUpdated, "aliases", getAliases);
        updateStorageIfNeeded(item.factMappings, item.factMappingsUpdated, "factMappings", getFactMappings);
        updateStorageIfNeeded(item.factPacks, item.factPacksUpdated, "factPacks", getFactPacks);
        updateStorageIfNeeded(item.regexWebsites, item.regexWebsitesUpdated, "regexWebsites", getRegexSitePages);

        //Be sure to get latest version of website objects if we just upgraded
        if (item.installedVersion == null || item.installedVersion != manifest.version) {
            browser.storage.local.clear();
            getTimestamps();
            getSitePages();
            getAliases();
            getFactMappings();
            getFactPacks();
            getRegexSitePages();
            browser.storage.local.set({
                installedVersion: manifest.version
            });
        }
    }


    //Build a name index for searching on
    var websiteNameIndex = storage.websites.map(function (obj, index) {
        return {
            RowIndex: index,
            Name: obj.Name
        }
    });

    websiteNameIndex.sort(function (a, b) {
        return ('' + a.Name).localeCompare(b.Name);
    });

    storage.websitesNameIndex = websiteNameIndex;

}

updateActiveTab();

browser.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.command == "getWebsiteByDomain") {
            var domain = request.domain;
            if (!request.domain.startsWith("http")) {
                domain = "http://" + request.domain;
            }

            var websiteResult = null;
            var biasText = "Unknown";
            var overallBias = -2147483648;

            try {
                var managedUrl = new URL(domain);

                websiteResult = getWebsiteByDomain(managedUrl.hostname);
                biasText = "Unknown";
                overallBias = -2147483648;
                if (websiteResult != null) {
                    overallBias = FactLayerUtilities.getOverallBias(websiteResult.Sources);
                    biasText = getIconText(overallBias, websiteResult.OrganizationType);
                }
            } catch (ex) {
                console.log(ex);
            }
            sendResponse({websiteResult: websiteResult, biasText: biasText, overallBias: overallBias});
        } else if (request.command == "getWebsiteByName") {
            var name = request.name;

            var websiteResult = null;
            var biasText = "Unknown";
            var overallBias = -2147483648;

            try {
                websiteResult = getWebsiteByName(name);
                biasText = "Unknown";
                overallBias = -2147483648;
                if (websiteResult != null) {
                    overallBias = FactLayerUtilities.getOverallBias(websiteResult.Sources);
                    biasText = getIconText(overallBias, websiteResult.OrganizationType);
                }
            } catch (ex) {
                console.log(ex);
            }
            sendResponse({websiteResult: websiteResult, biasText: biasText, overallBias: overallBias});
        } else if (request.command == "getBiasColors") {
            var biasColors = [];
            biasColors.push({bias: 'extreme-left', color: FactLayerUtilities.getBiasColor(-3, 0)})
            biasColors.push({bias: 'left', color: FactLayerUtilities.getBiasColor(-2, 0)})
            biasColors.push({bias: 'left-center', color: FactLayerUtilities.getBiasColor(-1, 0)})
            biasColors.push({bias: 'center', color: FactLayerUtilities.getBiasColor(0, 0)})
            biasColors.push({bias: 'right-center', color: FactLayerUtilities.getBiasColor(1, 0)})
            biasColors.push({bias: 'right', color: FactLayerUtilities.getBiasColor(2, 0)})
            biasColors.push({bias: 'extreme-right', color: FactLayerUtilities.getBiasColor(3, 0)})
            biasColors.push({bias: 'satire', color: FactLayerUtilities.getBiasColor(0, 4)})
            biasColors.push({bias: 'fake', color: FactLayerUtilities.getBiasColor(0, 5)})
            biasColors.push({bias: 'unknown', color: FactLayerUtilities.getBiasColor()})
            sendResponse({biasColors: biasColors});
        }

    });


