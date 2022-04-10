//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

if (browser) {
    let bg = null;
    document.addEventListener('DOMContentLoaded', function () {
        bg = browser.extension.getBackgroundPage();
        let storage = bg.getStorage();
        if (storage.websites != null) {
            document.querySelector("#WebsiteCount").textContent = storage.websites.length;
        } else {
            document.querySelector("#WebsiteCount").textContent = 0;
        }

        if (storage.websitesUpdated != null) {
            document.querySelector("#WebsiteUpdated").textContent = getFormattedDate(storage.websitesUpdated);
        } else {
            document.querySelector("#WebsiteUpdated").textContent = "Never";
        }

        if (storage.aliases != null) {
            document.querySelector("#AliasesCount").textContent = storage.aliases.length;
        } else {
            document.querySelector("#AliasesCount").textContent = 0;
        }

        if (storage.aliasesUpdated != null) {
            document.querySelector("#AliasesUpdated").textContent = getFormattedDate(storage.aliasesUpdated);
        } else {
            document.querySelector("#AliasesUpdated").textContent = "Never";
        }

        if (storage.factMappings != null) {
            document.querySelector("#FactMappingsCount").textContent = storage.factMappings.length;
        } else {
            document.querySelector("#FactMappingsCount").textContent = 0;
        }

        if (storage.factMappingsUpdated != null) {
            document.querySelector("#FactMappingsUpdated").textContent = getFormattedDate(storage.factMappingsUpdated);
        } else {
            document.querySelector("#FactMappingsUpdated").textContent = "Never";
        }

        if (storage.factPacks != null) {
            document.querySelector("#FactPacksCount").textContent = storage.factPacks.length;
        } else {
            document.querySelector("#FactPacksCount").textContent = 0;
        }

        if (storage.factPacksUpdated != null) {
            document.querySelector("#FactPacksUpdated").textContent = getFormattedDate(storage.factPacksUpdated);
        } else {
            document.querySelector("#FactPacksUpdated").textContent = "Never";
        }

        if (storage.timestampsUpdated != null) {
            document.querySelector("#LastChecked").textContent = getFormattedDate(storage.timestampsUpdated);
        } else {
            document.querySelector("#LastChecked").textContent = "Never";
        }

        let settings = bg.getPreferences();
        document.querySelector("#ExtremeLeftColor").value = settings.extremeLeftColor;
        document.querySelector("#LeftColor").value = settings.leftColor;
        document.querySelector("#LeftCenterColor").value = settings.leftCenterColor;
        document.querySelector("#CenterColor").value = settings.centerColor;
        document.querySelector("#RightCenterColor").value = settings.rightCenterColor;
        document.querySelector("#RightColor").value = settings.rightColor;
        document.querySelector("#ExtremeRightColor").value = settings.extremeRightColor;
        document.querySelector("#SatireColor").value = settings.satireColor;
    });
    
    document.addEventListener('click', function () {
        // If the clicked element doesn't have the right selector, bail
        if (event.target.matches('#btnRefreshDatabase')) {
            bg.getTimestamps();
            bg.getSitePages();
            bg.getAliases();
            bg.getFactMappings();
            bg.getFactPacks();
            bg.getFactPacks();
            bg.getRegexSitePages();
            let target = document.getElementsByTagName('body')[0];
            let spinner = new Spin.Spinner({scale: 3}).spin(target);
            document.querySelector("#WebsiteCount").textContent = "";
            document.querySelector("#WebsiteUpdated").textContent = "";
            document.querySelector("#AliasesCount").textContent = "";
            document.querySelector("#AliasesUpdated").textContent = "";
            document.querySelector("#FactMappingsCount").textContent = "";
            document.querySelector("#FactMappingsUpdated").textContent = "";
            document.querySelector("#FactPacksCount").textContent = "";
            document.querySelector("#FactPacksUpdated").textContent = "";
            document.querySelector("#LastChecked").textContent = "";
            let backgroundCheck = setInterval(function () {
                let storage = bg.getStorage();
                if (storage.websites.length != 0 && storage.aliases.length != 0 && storage.factMappings.length != 0 && storage.factPacks.length != 0) {
                    document.querySelector("#WebsiteCount").textContent = storage.websites.length;
                    document.querySelector("#WebsiteUpdated").textContent = getFormattedDate(storage.timestamps.websites);
                    document.querySelector("#AliasesCount").textContent = storage.aliases.length;
                    document.querySelector("#AliasesUpdated").textContent = getFormattedDate(storage.timestamps.aliases);
                    document.querySelector("#FactMappingsCount").textContent = storage.factMappings.length;
                    document.querySelector("#FactMappingsUpdated").textContent = getFormattedDate(storage.timestamps.factMappings);
                    document.querySelector("#FactPacksCount").textContent = storage.factPacks.length;
                    document.querySelector("#FactPacksUpdated").textContent = getFormattedDate(storage.timestamps.factPacks);
                    document.querySelector("#LastChecked").textContent = getFormattedDate(storage.timestampsUpdated);
                    spinner.stop();
                    clearInterval(backgroundCheck);
                }
            }, 1000);
        }
    }, false);            

    document.addEventListener('click', function () {
        // If the clicked element doesn't have the right selector, bail
        if (event.target.matches('#btnSaveSettings')) {
            let target = document.getElementsByTagName('body')[0];
            let spinner = new Spin.Spinner({scale: 3}).spin(target);
            let settings = {};
            settings.extremeLeftColor = document.querySelector("#ExtremeLeftColor").value;
            settings.leftColor = document.querySelector("#LeftColor").value;
            settings.leftCenterColor = document.querySelector("#LeftCenterColor").value;
            settings.centerColor = document.querySelector("#CenterColor").value;
            settings.rightCenterColor = document.querySelector("#RightCenterColor").value;
            settings.rightColor = document.querySelector("#RightColor").value;
            settings.extremeRightColor =document.querySelector("#ExtremeRightColor").value
            settings.satireColor = document.querySelector("#SatireColor").value;
            bg.setPreferences(settings);
            spinner.stop();
        }
        
    }, false);
    
    

    function getFormattedDate(dateParam) {

        let d = new Date(dateParam);
        d = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2);

        return d;
    }
}
