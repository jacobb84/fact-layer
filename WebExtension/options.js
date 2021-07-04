//Handle chrome
if (typeof browser === 'undefined') {
    browser = chrome;
}

if (browser) {

    document.addEventListener('DOMContentLoaded', function () {
        var bg = browser.extension.getBackgroundPage();

        if (bg.storage.websites != null) {
            $("#WebsiteCount").html(bg.storage.websites.length);
        } else {
            $("#WebsiteCount").html(0);
        }

        if (bg.storage.websitesUpdated != null) {
            $("#WebsiteUpdated").html(getFormattedDate(bg.storage.websitesUpdated));
        } else {
            $("#WebsiteUpdated").html("Never");
        }

        if (bg.storage.aliases != null) {
            $("#AliasesCount").html(bg.storage.aliases.length);
        } else {
            $("#AliasesCount").html(0);
        }

        if (bg.storage.aliasesUpdated != null) {
            $("#AliasesUpdated").html(getFormattedDate(bg.storage.aliasesUpdated));
        } else {
            $("#AliasesUpdated").html("Never");
        }

        if (bg.storage.factMappings != null) {
            $("#FactMappingsCount").html(bg.storage.factMappings.length);
        } else {
            $("#FactMappingsCount").html(0);
        }

        if (bg.storage.factMappingsUpdated != null) {
            $("#FactMappingsUpdated").html(getFormattedDate(bg.storage.factMappingsUpdated));
        } else {
            $("#FactMappingsUpdated").html("Never");
        }

        if (bg.storage.factPacks != null) {
            $("#FactPacksCount").html(bg.storage.factPacks.length);
        } else {
            $("#FactPacksCount").html(0);
        }

        if (bg.storage.factPacksUpdated != null) {
            $("#FactPacksUpdated").html(getFormattedDate(bg.storage.factPacksUpdated));
        } else {
            $("#FactPacksUpdated").html("Never");
        }

        if (bg.storage.timestampsUpdated != null) {
            $("#LastChecked").html(getFormattedDate(bg.storage.timestampsUpdated));
        } else {
            $("#LastChecked").html("Never");
        }

        $("#ExtremeLeftColor").val(bg.settings.extremeLeftColor);
        $("#LeftColor").val(bg.settings.leftColor);
        $("#LeftCenterColor").val(bg.settings.leftCenterColor);
        $("#CenterColor").val(bg.settings.centerColor);
        $("#RightCenterColor").val(bg.settings.rightCenterColor);
        $("#RightColor").val(bg.settings.rightColor);
        $("#ExtremeRightColor").val(bg.settings.extremeRightColor);
        $("#SatireColor").val(bg.settings.satireColor);

        $("#btnRefreshDatabase").on("click", function () {
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
            $("#LastChecked").html("");
            var backgroundCheck = setInterval(function () {
                if (bg.storage.websites.length != 0 && bg.storage.aliases.length != 0 && bg.storage.factMappings.length != 0 && bg.storage.factPacks.length != 0) {
                    $("#WebsiteCount").html(bg.storage.websites.length);
                    $("#WebsiteUpdated").html(getFormattedDate(bg.storage.timestamps.websites));
                    $("#AliasesCount").html(bg.storage.aliases.length);
                    $("#AliasesUpdated").html(getFormattedDate(bg.storage.timestamps.aliases));
                    $("#FactMappingsCount").html(bg.storage.factMappings.length);
                    $("#FactMappingsUpdated").html(getFormattedDate(bg.storage.timestamps.factMappings));
                    $("#FactPacksCount").html(bg.storage.factPacks.length);
                    $("#FactPacksUpdated").html(getFormattedDate(bg.storage.timestamps.factPacks));
                    $("#LastChecked").html(getFormattedDate(bg.storage.timestampsUpdated));
                    spinner.stop();
                    clearInterval(backgroundCheck);
                }
            }, 1000);
        });

        $("#btnSaveSettings").on("click", function () {
            var target = document.getElementsByTagName('body')[0];
            var spinner = new Spinner().spin(target);
            bg.settings.extremeLeftColor = $("#ExtremeLeftColor").val();
            bg.settings.leftColor = $("#LeftColor").val();
            bg.settings.leftCenterColor = $("#LeftCenterColor").val();
            bg.settings.centerColor = $("#CenterColor").val();
            bg.settings.rightCenterColor = $("#RightCenterColor").val();
            bg.settings.rightColor = $("#RightColor").val();
            bg.settings.extremeRightColor = $("#ExtremeRightColor").val();
            bg.settings.satireColor = $("#SatireColor").val();
            bg.saveSettings();
            spinner.stop();
        });
    })

    function getFormattedDate(dateParam) {

        var d = new Date(dateParam);
        d = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2);

        return d;
    }
}
