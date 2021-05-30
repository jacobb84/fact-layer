﻿using System;
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
using System.Text.RegularExpressions;

namespace FactLayer.Import
{
    public class AllSidesImporter : BaseImporter
    {
        private static OrganizationSite LoadSite(string url)
        {
            if (url == "/news-source/test-source" || url == "/news-source/yahoo-360-media-bias")
            {
                return null;
            }

            var doc = new HtmlAgilityPack.HtmlDocument();
            var request = (HttpWebRequest)WebRequest.Create("https://www.allsides.com" + url);

            var response = (HttpWebResponse)request.GetResponse();
            string html;
            using (var sr = new StreamReader(response.GetResponseStream()))
            {
                html = sr.ReadToEnd();
            }
            doc.LoadHtml(html);

            var siteInfo = doc.QuerySelectorAll(".dynamic-grid > a").FirstOrDefault();
            if (siteInfo != null)
            {
                var domain = "";
                //Override for weird format
                if (url == "/news-source/suspend-belief-podcast")
                {
                    domain = "suspendbeliefpodcast.com";
                }
                else
                {
                    domain = ExtractDomainNameFromURL(siteInfo.Attributes["href"].Value);
                }

                if (IgnoreUrl(domain))
                {
                    return null;
                }
                if (_sites.Any(s => s.Domain.Equals(domain)))
                {
                    var site = _sites.Where(s => s.Domain.Equals(domain)).Single();
                    if (site.Sources.Any(s => s.Organization == SourceOrganization.AllSides && s.ClaimType == SourceClaimType.Bias))
                    {
                        var source = site.Sources.Where(s => s.Organization == SourceOrganization.AllSides && s.ClaimType == SourceClaimType.Bias).Single();
                        source.ClaimValue = (int)GetBias(doc.QuerySelector(".rating-area a").InnerHtml.ToLower());
                    }
                    else
                    {

                        var source = new Source();
                        source.Organization = SourceOrganization.AllSides;
                        source.URL = "https://www.allsides.com" + url;
                        source.ClaimType = SourceClaimType.Bias;
                        source.ClaimValue = (int)GetBias(doc.QuerySelector(".rating-area a").InnerHtml.ToLower());
                        site.Sources.Add(source);
                    }


                    Console.WriteLine("Updated " + site.Name);
                    return site;
                }
                else
                {
                    var site = new OrganizationSite();
                    site.Name = HttpUtility.HtmlDecode(doc.QuerySelector(".latest_news_source h1").InnerText);
                    site.Domain = ExtractDomainNameFromURL(siteInfo.Attributes["href"].Value);
                    if (doc.QuerySelector(".latest_news_source p").InnerText == "Think Tank / Policy Group")
                    {
                        site.OrganizationType = OrgType.ThinkTank;
                    }
                    else
                    {
                        site.OrganizationType = OrgType.NewsMedia;
                    }


                    if (doc.QuerySelector("a[title=Wikipedia]") != null && doc.QuerySelector("a[title=Wikipedia]").Attributes["href"].Value.Contains("wikipedia"))
                    {
                        var wikiUrl = doc.QuerySelector("a[title=Wikipedia]").Attributes["href"].Value;
                        site.Description = GetWikipediaDescription(wikiUrl);
                        site.Wikipedia = wikiUrl;
                    }

                    var source = new Source();
                    source.Organization = SourceOrganization.AllSides;
                    source.URL = "https://www.allsides.com" + url;
                    source.ClaimType = SourceClaimType.Bias;
                    source.ClaimValue = (int)GetBias(doc.QuerySelector(".rating-area a").InnerHtml.ToLower());
                    site.Sources.Add(source);


                    Console.WriteLine("Loaded " + site.Name);
                    return site;
                }
            }
            else
            {
                return null;
            }

        }

        private static Bias GetBias(string bias)
        {
            if (bias.Equals("left"))
            {
                return Bias.Left;
            }
            else if (bias.Equals("lean left"))
            {
                return Bias.LeftCenter;
            }
            else if (bias.Equals("mixed") || bias.Equals("center"))
            {
                return Bias.Center;
            }
            else if (bias.Equals("lean right"))
            {
                return Bias.RightCenter;
            }
            else if (bias.Equals("right"))
            {
                return Bias.Right;
            }
            else
            {
                return Bias.Unknown;
            }
        }

        private static List<OrganizationSite> _sites;
        public static void Import(int currentPage)
        {
            var doc = new HtmlAgilityPack.HtmlDocument();
            WebRequest request = null;
            if (currentPage == 0)
            {
                request = WebRequest.Create(ConfigurationManager.AppSettings["AllSidesURL"]);
            } else
            {
                request = WebRequest.Create(ConfigurationManager.AppSettings["AllSidesURL"]+"&page="+currentPage);
            }

            var response = (HttpWebResponse)request.GetResponse();
            string html;
            using (var sr = new StreamReader(response.GetResponseStream()))
            {
                html = sr.ReadToEnd();
            }
            doc.LoadHtml(html);
            var rows = doc.DocumentNode.QuerySelectorAll("table tr");

            if (doc.DocumentNode.QuerySelector("table tr > td").InnerText == "No Record(s) found.")
            {
                return;
            }

            foreach (var row in rows)
            {
                var siteUrl = row.QuerySelector("td.source-title a");
                if (siteUrl != null)
                {
                    var site = LoadSite(siteUrl.Attributes["href"].Value);
                    if (site != null && !_sites.Contains(site))
                    {
                        _sites.Add(site);
                    }

                }

            }

            if (doc.QuerySelector("li.pager-next") != null)
            {
                Import(++currentPage);
            }
        }

        public static List<OrganizationSite> StartImport(List<OrganizationSite> sites)
        {
            _sites = sites;
            ServicePointManager.Expect100Continue = true;
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            Import(0);
            return _sites;
        }
    }
}
