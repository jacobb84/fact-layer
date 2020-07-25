using FactLayer.Import.Models;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace FactLayer.Import
{
    public class OpenSourcesImporter : BaseImporter
    {

        private static string[] typeIndexes = new string[]
        {
            "type",
            "2nd type",
            "3rd type"
        };

        private static OrgType GetOrgType(JToken jobj, int index)
        {
            if (jobj[typeIndexes[index]].Value<string>() == "fake" || jobj[typeIndexes[index]].Value<string>() == "fake news")
            {
                return OrgType.Fake;
            }
            else if (jobj[typeIndexes[index]].Value<string>() == "satire")
            {
                return OrgType.Satire;
            }
            else if (jobj[typeIndexes[index]].Value<string>() == "hate")
            {
                return OrgType.HateGroup;
            }
            else if (jobj[typeIndexes[index]].Value<string>() == "clickbait")
            {
                return OrgType.ClickBait;
            }
            else if (jobj[typeIndexes[index]].Value<string>() == "conspiracy" || jobj[typeIndexes[index]].Value<string>() == "junksci")
            {
                return OrgType.ExtremelyUnreliable;
            }
            else
            {
                if (index == 2)
                {
                    return OrgType.Other;
                } else
                {
                    return GetOrgType(jobj, ++index);
                }
            }

        }

        public static List<OrganizationSite> StartImport(List<OrganizationSite> sites)
        {
            var request = (HttpWebRequest)WebRequest.Create("https://raw.githubusercontent.com/BigMcLargeHuge/opensources/master/sources/sources.json");
            request.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:56.0) Gecko/20100101 Firefox/56.0";
            var response = (HttpWebResponse)request.GetResponse();
            string jsonfile;
            using (var sr = new StreamReader(response.GetResponseStream()))
            {
                jsonfile = sr.ReadToEnd();
            }
            var json = JObject.Parse(jsonfile);

            foreach (var jobj in json.Children<JProperty>())
            {
                var domain = ExtractDomainNameFromURL(jobj.Name);
                var orgType = GetOrgType(jobj.Value<JToken>().ElementAt(0), 0);
                if (orgType == OrgType.Other)
                {
                    continue;
                }

                if (sites.Any(s => s.Domain.Equals(domain)))
                {
                    var site = sites.Where(s => s.Domain.Equals(domain)).Single();
                    if (site.OrganizationType != OrgType.HateGroup && site.OrganizationType != OrgType.Fake && site.OrganizationType != OrgType.ExtremelyUnreliable)
                    {
                        site.OrganizationType = orgType;
                    }
                    if (site.Sources.Any(s => s.Organization == SourceOrganization.OpenSources))
                    {

                        if (orgType == OrgType.HateGroup)
                        {
                            if (site.Sources.Any(s => s.Organization == SourceOrganization.OpenSources && s.ClaimType == SourceClaimType.OrgType))
                            {
                                var source = site.Sources.Where(s => s.Organization == SourceOrganization.OpenSources && s.ClaimType == SourceClaimType.OrgType).Single();
                                source.ClaimValue = (int)orgType;
                                Console.WriteLine("Updating Source for " + site.Name);
                            }
                        }
                        else
                        {
                            var source = site.Sources.Where(s => s.Organization == SourceOrganization.OpenSources && s.ClaimType == SourceClaimType.Veracity).Single();
                            source.ClaimValue = (int)orgType;
                            Console.WriteLine("Updating Source for " + site.Name);
                        }
                    }
                    else
                    {
                        if (orgType == OrgType.HateGroup)
                        {
                            var source = new Source();
                            source.ClaimType = SourceClaimType.OrgType;
                            source.ClaimValue = (int)orgType;
                            source.Organization = SourceOrganization.OpenSources;
                            source.URL = "http://www.opensources.co/";
                            site.Sources.Add(source);
                            Console.WriteLine("Added Source for " + site.Name);
                        }
                        else
                        {
                            var source = new Source();
                            source.ClaimType = SourceClaimType.Veracity;
                            source.ClaimValue = (int)orgType;
                            source.Organization = SourceOrganization.OpenSources;
                            source.URL = "http://www.opensources.co/";
                            site.Sources.Add(source);
                            Console.WriteLine("Added Source for " + site.Name);
                        }

                    }
                }
                else
                {
                    var site = new OrganizationSite();
                    site.Name = domain;
                    site.OrganizationType = orgType;
                    site.Domain = domain;
                    if (orgType == OrgType.HateGroup)
                    {
                        var source = new Source();
                        source.ClaimType = SourceClaimType.OrgType;
                        source.ClaimValue = (int)orgType;
                        source.Organization = SourceOrganization.OpenSources;
                        source.URL = "http://www.opensources.co/";
                        site.Sources.Add(source);
                        Console.WriteLine("Added Source for " + site.Name);
                    }
                    else
                    {
                        var source = new Source();
                        source.ClaimType = SourceClaimType.Veracity;
                        source.ClaimValue = (int)orgType;
                        source.Organization = SourceOrganization.OpenSources;
                        source.URL = "http://www.opensources.co/";
                        site.Sources.Add(source);
                        Console.WriteLine("Added Source for " + site.Name);
                    }

                    sites.Add(site);
                    Console.WriteLine("Adding site " + site.Name);
                }
            } 

            return sites;
        }
    }
}
