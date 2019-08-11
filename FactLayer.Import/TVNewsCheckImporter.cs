using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using HtmlAgilityPack;
using System.Net;
using System.Configuration;
using System.IO;
using FactLayer.Import.Models;
using System.Web;
using Newtonsoft.Json.Linq;

namespace FactLayer.Import
{
    public class TVNewsCheckImporter : BaseImporter
    {

        private static List<OrganizationSite> _sites;
        public static void Import(string url)
        {
            var doc = new HtmlAgilityPack.HtmlDocument();
            var request = (HttpWebRequest)WebRequest.Create(url);
            request.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:56.0) Gecko/20100101 Firefox/56.0";
            var response = (HttpWebResponse)request.GetResponse();
            string retval;
            using (var sr = new StreamReader(response.GetResponseStream()))
            {
                retval = sr.ReadToEnd().Trim();
            }
            var json = JObject.Parse(retval);
            var stations = json.SelectToken("stations");
            foreach (var station in stations)
            {
                var siteUrl = station.SelectToken("website").Value<string>();
                if (!String.IsNullOrEmpty(siteUrl))
                {
                    var domain = ExtractDomainNameFromURL(siteUrl);
                    if (!String.IsNullOrEmpty(domain) && !IgnoreUrl(domain))
                    {
                        if (_sites.Any(s => s.Domain.Equals(domain)))
                        {
                            var site = _sites.Where(s => s.Domain.Equals(domain)).Single();
                            if (!site.Sources.Any(s => s.Organization == SourceOrganization.TVNewsCheck))
                            {
                                var source = new Source();
                                source.Organization = SourceOrganization.TVNewsCheck;
                                source.URL = "https://tvnewscheck.com/tv-station-directory/#/station/" + station.SelectToken("id").Value<string>();
                                source.ClaimType = SourceClaimType.OrgType;
                                source.ClaimValue = (int)OrgType.NewsMedia;
                                site.Sources.Add(source);
                                Console.WriteLine("Added Source for " + site.Name);
                            }
                            else
                            {
                                var source = site.Sources.Where(s => s.Organization == SourceOrganization.TVNewsCheck).Single();
                                source.URL = "https://tvnewscheck.com/tv-station-directory/#/station/" + station.SelectToken("id").Value<string>();
                                Console.WriteLine("Updated Source for " + site.Name);
                            }
                        }
                        else
                        {
                            var site = new OrganizationSite();
                            site.Name = station.SelectToken("call_sign").Value<string>();
                            site.Domain = domain;
                            site.OrganizationType = OrgType.NewsMedia;
                            var source = new Source();
                            source.Organization = SourceOrganization.TVNewsCheck;
                            source.URL = "https://tvnewscheck.com/tv-station-directory/#/station/" + station.SelectToken("id").Value<string>();
                            source.ClaimType = SourceClaimType.OrgType;
                            source.ClaimValue = (int)OrgType.NewsMedia;
                            site.Sources.Add(source);
                            Console.WriteLine("Loaded " + site.Name);
                            _sites.Add(site);
                        }
                    }
                }

            }
        }

        public static List<OrganizationSite> StartImport(List<OrganizationSite> sites)
        {
            ServicePointManager.Expect100Continue = true;
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            _sites = sites;
            //CBS
            Import("https://tvnewscheck.com/wp-json/station-directory/v1/network?id=dc961110-8ac7-11e8-90a4-c9cad5d5b436");
            //ABC
            Import("https://tvnewscheck.com/wp-json/station-directory/v1/network?id=dcab8870-8ac7-11e8-bca3-f1d7a11c66fc");
            //NBC
            Import("https://tvnewscheck.com/wp-json/station-directory/v1/network?id=dc919190-8ac7-11e8-99f9-93f8e7c66221");
            //FOX
            Import("https://tvnewscheck.com/wp-json/station-directory/v1/network?id=dcd4ed00-8ac7-11e8-bfdb-d9c87d6dd64d");
            //CW
            Import("https://tvnewscheck.com/wp-json/station-directory/v1/network?id=dd1609c0-8ac7-11e8-b879-0fc7bac0703a");
            //PBS
            Import("https://tvnewscheck.com/wp-json/station-directory/v1/network?id=dc9ea0d0-8ac7-11e8-86bc-bb867d6214d3");
            //F&M
            Import("https://tvnewscheck.com/wp-json/station-directory/v1/network?id=304f8d60-8ac8-11e8-a0ff-750bcbee96b7");
            return _sites;
        }
    }
}
