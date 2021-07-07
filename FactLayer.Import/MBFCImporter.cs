using FactLayer.Import.Models;
using HtmlAgilityPack;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using System.Web;

namespace FactLayer.Import
{
    public class MBFCImporter : MBFCBaseImporter
    {
        private static OrgType GetOrgType(HtmlNode node)
        {
            var description = node.InnerText;
            if (description.Contains("blog"))
            {
                return OrgType.Blog;
            }
            else if (description.Contains("activist"))
            {
                return OrgType.Activist;
            }
            else if (description.Contains("thinktank") || description.Contains("policy"))
            {
                return OrgType.ThinkTank;
            }
            else if (description.Contains("nonprofit") || description.Contains("non-profit"))
            {
                return OrgType.NonProfit;
            }
            else if (description.Contains("watchdog") || description.Contains("fact-checker") || description.Contains("factchecker"))
            {
                return OrgType.FactChecker;
            }
            else if (description.Contains("news"))
            {
                return OrgType.NewsMedia;
            }
            else
            {
                return OrgType.Other;
            }
        }
        private static OrganizationSite LoadSite(string url)
        {
            try
            {
                var doc = new HtmlAgilityPack.HtmlDocument();
                var request = WebRequest.Create(url);
                var response = (HttpWebResponse)request.GetResponse();
                string html;
                using (var sr = new StreamReader(response.GetResponseStream()))
                {
                    html = sr.ReadToEnd();
                }
                doc.LoadHtml(html);
                var siteName = HttpUtility.HtmlDecode(doc.QuerySelector("h1.page-title").InnerHtml).Trim();
                var domainLink = getDomain(doc, siteName);

                if (domainLink != null)
                {
                    var domain = ExtractDomainNameFromURL(domainLink.Attributes["href"].Value);
                    if (IgnoreUrl(domain))
                    {
                        return null;
                    }
                    if (_sites.Any(s => s.Domain.Equals(domain)))
                    {
                        var site = _sites.Where(s => s.Domain.Equals(domain)).Single();
                        if (site.Sources.Any(s => s.Organization == SourceOrganization.MBFC && s.ClaimType == SourceClaimType.Bias))
                        {
                            var source = site.Sources.Where(s => s.Organization == SourceOrganization.MBFC && s.ClaimType == SourceClaimType.Bias).Single();
                            source.ClaimValue = (int)GetBias(doc);
                            Console.WriteLine("Updating Source for " + site.Name);
                        } else
                        {
                            var source = new Source();
                            source.Organization = SourceOrganization.MBFC;
                            source.URL = url;
                            source.ClaimType = SourceClaimType.Bias;
                            source.ClaimValue = (int)GetBias(doc);
                            site.Sources.Add(source);
                            Console.WriteLine("Added Source for " + site.Name);
                        }

                        return site;
                    }
                    else
                    {
                        var site = new OrganizationSite();
                        site.Name = siteName;
                        site.Domain = domain;
                        var notes = doc.QuerySelectorAll("div.entry-content p").Where(s => s.InnerText.Trim().ToLower().StartsWith("notes:"));
                        if (notes.Count() > 0)
                        {
                            site.OrganizationType = GetOrgType(notes.FirstOrDefault());
                            if (notes.FirstOrDefault().QuerySelectorAll("a").Any(s => s.Attributes["href"].Value.Contains("wikipedia")))
                            {
                                var wikiUrl = notes.FirstOrDefault().QuerySelectorAll("a").Where(s => s.Attributes["href"].Value.Contains("wikipedia")).FirstOrDefault().Attributes["href"].Value;
                                site.Wikipedia = wikiUrl;
                            }
                        }
                        
                        var source = new Source();
                        source.Organization = SourceOrganization.MBFC;
                        source.URL = url;
                        source.ClaimType = SourceClaimType.Bias;
                        source.ClaimValue = (int)GetBias(doc);
                        site.Sources.Add(source);
                        Console.WriteLine("Loaded " + site.Name);
                        return site;
                    }
                }
                else
                {
                    Console.WriteLine(siteName + ": Domain not found.");
                    return null;
                }
            } catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        private static List<OrganizationSite> _sites;
        public static void Import(string url)
        {
            var doc = new HtmlAgilityPack.HtmlDocument();
            var request = WebRequest.Create(url);
            var response = (HttpWebResponse)request.GetResponse();
            string html;
            using (var sr = new StreamReader(response.GetResponseStream()))
            {
                html = sr.ReadToEnd();
            }
            doc.LoadHtml(html);
            var rows = doc.DocumentNode.QuerySelectorAll("table.sort a");
            foreach(var row in rows)
            {
                var siteUrl = row.Attributes["href"].Value;
                if (siteUrl != null)
                {
                    siteUrl = NormalizeSiteUrl(siteUrl);
                    var site = LoadSite(siteUrl);
                    if (site != null && !_sites.Contains(site))
                    {
                        _sites.Add(site);
                    }
                }

            }
        }

        public static List<OrganizationSite> StartImport(List<OrganizationSite> sites)
        {
            ServicePointManager.Expect100Continue = true;
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            _sites = sites;
            Import("https://mediabiasfactcheck.com/left/");
            Import("https://mediabiasfactcheck.com/leftcenter/");
            Import("https://mediabiasfactcheck.com/center/");
            Import("https://mediabiasfactcheck.com/right-center/");
            Import("https://mediabiasfactcheck.com/right/");
            //Sites not listed in the index
            var site = LoadSite("https://mediabiasfactcheck.com/the-register-uk/");
            if (site != null && !_sites.Contains(site))
            {
                _sites.Add(site);
            }
            return _sites;
        }
    }
}
