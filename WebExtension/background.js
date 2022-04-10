//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

let orgSiteVersion = "1.3";
let aliasVersion = "1.0";
let factMappingsVersion = "1.0";
let factPacksVersion = "1.0";
let regOrgSiteVersion = "1.0";
let currentTab;
let manifest = browser.runtime.getManifest();
let currentTabUrl = "";
let currentWebsite = null;
let currentArticle = null;

let storage = {
    websites: [],
    websitesNameIndex: [],
    regexWebsites: [],
    aliases: [],
    factMappings: [],
    factPacks: [],
    timestamps: {}
}

let settings = {
    extremeLeftColor: "#0000FF",
    leftColor: "#2E65A1",
    leftCenterColor: "#9DC8EB",
    centerColor: "#8D698D",
    rightCenterColor: "#CDA59C",
    rightColor: "#A52A2A",
    extremeRightColor: "#FF0000",
    satireColor: "#007F0E"
}

function getCurrentArticle() {
    return currentArticle;
}

function getCurrentWebsite()
{
    return currentWebsite;
}

function getStorage() {
    return storage;
}

function getPreferences() {
    return settings;
}

function setPreferences(newSettings) {
    settings = Object.assign({}, newSettings);
    let browserStorage = {};
    browserStorage["settings"] = newSettings;
    browser.storage.local.set(browserStorage);
}

function getResponse(response) { 
    return response.json();
}

function isEmpty(obj) {
  for(let prop in obj) {
    if(Object.prototype.hasOwnProperty.call(obj, prop)) {
      return false;
    }
  }

  return JSON.stringify(obj) === JSON.stringify({});
}

function getWebsiteByDomain(domain) {
    domain = domain.replace(/^(www|amp|m|mobile)\./g, "");
    //See if this is an alias
    let aliasDomain = storage.aliases.find(function (newsSource) {
        return domain.endsWith(newsSource.alias);
    });


    if (aliasDomain) {
        domain = aliasDomain.host;
    }

    return FactLayerUtilities.binarySearchByDomain(storage.websites, domain);
}

function getWebsiteByName(name) {
    let result = FactLayerUtilities.binarySearchByName(storage.websitesNameIndex, name);
    if (result) {
        let website = storage.websites[result.RowIndex];

        return website;
    }

    return null;
}

function updateTimestampsIfNeeded(browserStorage, storageUpdated) {
    if (browserStorage != null && isEmpty(browserStorage) == false && storageUpdated != null && isEmpty(storageUpdated) == false) {
        //Set date to compare to yesterday
        let yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        let lastCheckedDate = new Date(storageUpdated);
        //If the last update time is greater then 24 hours ago, load from storage. Otherwise get a fresh copy.
        if (lastCheckedDate > yesterday) {
            storage.timestamps = browserStorage;
            storage.timestampsUpdated = storageUpdated;
        } else {
            getTimestamps();
        }

    } else {
        getTimestamps();
    }
}

function getTimestamps() {
    storage.timestamps = [];
    storage.timestampsUpdated = {};
    let api = "http://factlayer.azurewebsites.net/timestamps.json?cachebust=" + new Date().getTime();
    fetch(api).then(getResponse).then(function (returndata) {
        let browserStorage = {};
        storage.timestamps = returndata;
        storage.timestampsUpdated = new Date().toISOString();
        browserStorage["timestamps"] = storage.timestamps;
        browserStorage["timestampsUpdated"] = storage.timestampsUpdated;
        browser.storage.local.set(browserStorage);
    });
}


function updateStorageIfNeeded(browserStorage, storageUpdated, storageProperty, globalUpdateFunction) {
    if (browserStorage != null && storageUpdated != null) {
        let lastCheckedDate = new Date(storageUpdated);
        let lastestTimestamp = new Date(storage.timestamps[storageProperty]);
        if (lastCheckedDate < lastestTimestamp) {
            globalUpdateFunction();
        } else {
            storage[storageProperty] = browserStorage;
            storage[storageProperty + "Updated"] = storageUpdated;
        }

    } else {
        globalUpdateFunction();
    }
}

function getJsonFile(url, storageProperty) {
    storage[storageProperty] = [];
    storage[storageProperty + "Updated"] = {};
    let api = url + "?cachebust=" + new Date().getTime();
    fetch(api).then(getResponse).then(function (returndata) {
            let browserStorage = {};
            storage[storageProperty] = returndata;
            storage[storageProperty + "Updated"] = storage.timestamps[storageProperty];
            browserStorage[storageProperty] = storage[storageProperty];
            browserStorage[storageProperty + "Updated"] = storage[storageProperty + "Updated"];
            browser.storage.local.set(browserStorage);
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
    let iconColor = FactLayerUtilities.getBiasColor(bias, orgType);
    let iconImage = FactLayerUtilities.getIconImage(orgType);

    let img = new Image();
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d", {alpha: false});
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
    let websiteResult = storage.regexWebsites.find(function (site) {
        let regex = new RegExp(site.Domain, 'gi');
        let isMatch = regex.test(domain);
        return isMatch;
    });
    return websiteResult;
}

/*
 * Switches currentTab and factcheck to reflect the currently active tab
 */
function updateActiveTab(tabId, changeInfo, tabInfo) {

    function updateTab(tabs) {
        if (browser.runtime.lastError) {
            window.setTimeout(() => updateActiveTab(), 100);
        }
        if (tabs && tabs[0]) {
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

                if (currentTab.url.startsWith("chrome://") || currentTab.url.startsWith("moz-extension://")) {
                    return;
                }
                let managedUrl = new URL(currentTab.url);
                let path = managedUrl.pathname + managedUrl.search;

                let websiteResult = getWebsiteByDomain(managedUrl.hostname);
                if (websiteResult == null) {
                    websiteResult = getRegexWebsite(managedUrl.hostname)
                }
                if (websiteResult != null) {
                    currentWebsite = websiteResult;
                    let totalBias = FactLayerUtilities.getOverallBias(websiteResult.Sources);
                    browser.browserAction.setTitle({
                        title: getIconText(totalBias, websiteResult.OrganizationType),
                        tabId: currentTab.id
                    });
                    updateIcon(totalBias, websiteResult.OrganizationType);
                    browser.browserAction.enable(currentTab.id);

                    let factResultDomain = storage.factMappings.find(function (mapping) {
                        return mapping.Domain == websiteResult.Domain;
                    });

                    if (factResultDomain != null) {
                        let factResultPage = factResultDomain.Pages.find(function (page) {
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

function onLoadSettings(item) {
    if (item != null && !(isEmpty(item) || item.length === 0)) {
        settings = item.settings;
    }

}

function onGotItems(item) {
    if (item != null && isEmpty(item) || item.length === 0) {
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
    let websiteNameIndex = storage.websites.map(function (obj, index) {
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

function handleMessage(request, sender, sendResponse) {
    if (request.command == "getWebsiteByDomain") {
        let domain = request.domain;
        if (!request.domain.startsWith("http")) {
            domain = "http://" + request.domain;
        }

        let websiteResult = null;
        let biasText = "Unknown";
        let overallBias = -2147483648;

        try {
            let managedUrl = new URL(domain);

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
        let name = request.name;

        let websiteResult = null;
        let biasText = "Unknown";
        let overallBias = -2147483648;

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
        let biasColors = [];
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

}

//Load local storage into memory and check for updates.
browser.storage.local.get(["regexWebsites", "regexWebsitesUpdated", "websites", "websitesUpdated", "installedVersion", "aliases", "aliasesUpdated", "factMappings", "factMappingsUpdated", "factPacks", "factPacksUpdated", "timestamps", "timestampsUpdated"], onGotItems);
browser.storage.local.get(["settings"], onLoadSettings);

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

//Get messages from content scripts
browser.runtime.onMessage.addListener(handleMessage);
updateActiveTab();
