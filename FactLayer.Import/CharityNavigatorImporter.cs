using FactLayer.Import.Models;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FactLayer.Import
{
    public class CharityNavigatorImporter : BaseImporter
    {
        public static List<OrganizationSite> StartImport(List<OrganizationSite> sites)
        {

            string charityFile = File.ReadAllText("CharityNavigator.json");
            var json = JArray.Parse(charityFile);

            foreach (var charity in json)
            {
                if (charity["currentRating"] != null && charity["websiteURL"] != null && charity["websiteURL"].Value<string>() != null)
                {
                    var domain = ExtractDomainNameFromURL(charity["websiteURL"].Value<string>());

                    if (sites.Any(s => s.Domain.Equals(domain)))
                    {
                        var site = sites.Where(s => s.Domain.Equals(domain)).Single();
                        if (site.Sources.Any(s => s.Organization == SourceOrganization.CharityNavigator && s.ClaimType == SourceClaimType.CharityRating))
                        {
                            var source = site.Sources.Where(s => s.Organization == SourceOrganization.CharityNavigator && s.ClaimType == SourceClaimType.CharityRating).Single();
                            source.ClaimValue = charity["currentRating"]["rating"].Value<int>();
                            Console.WriteLine("Updating Source for " + site.Name);
                        }
                        else
                        {
                            var source = new Source();
                            source.ClaimType = SourceClaimType.CharityRating;
                            source.ClaimValue = charity["currentRating"]["rating"].Value<int>();
                            source.Organization = SourceOrganization.CharityNavigator;
                            source.URL = charity["orgID"].Value<string>();
                            site.Sources.Add(source);
                            Console.WriteLine("Added Source for " + site.Name);
                        }
                    }
                    else
                    {
                        var site = new OrganizationSite();
                        site.Name = charity["charityName"].Value<string>();
                        site.OrganizationType = OrgType.NonProfit;
                        site.Domain = domain;
                        var source = new Source();
                        source.ClaimType = SourceClaimType.CharityRating;
                        source.ClaimValue = charity["currentRating"]["rating"].Value<int>();
                        source.Organization = SourceOrganization.CharityNavigator;
                        source.URL = charity["orgID"].Value<string>();
                        site.Sources.Add(source);
                        sites.Add(site);
                        Console.WriteLine("Adding site " + site.Name);
                    }
                } 
            }

            return sites;
        }
    }
}
