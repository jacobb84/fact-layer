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
using System.Text.RegularExpressions;

namespace FactLayer.Import
{
    public class MBFCImporter : BaseImporter
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
                var domainLink = doc.QuerySelectorAll("div.entry-content p a[target=_blank]").Where(s => s.InnerHtml == s.Attributes["href"].Value).FirstOrDefault();
                if (domainLink != null)
                {
                    var domain = ExtractDomainNameFromURL(domainLink.Attributes["href"].Value).Replace("www.", "");
                    if (_sites.Any(s => s.Domain.Equals(domain)))
                    {
                        var site = _sites.Where(s => s.Domain.Equals(domain)).Single();
                        if (site.Sources.Any(s => s.Organization == "Media Bias / Fact Check" && s.ClaimType == SourceClaimType.Bias))
                        {
                            var source = site.Sources.Where(s => s.Organization == "Media Bias / Fact Check" && s.ClaimType == SourceClaimType.Bias).Single();
                            source.ClaimValue = (int)GetBias(doc.QuerySelector("h1 img").Attributes["src"].Value);
                            Console.WriteLine("Updating Source for " + site.Name);
                        } else
                        {
                            var source = new Source();
                            source.Organization = "Media Bias / Fact Check";
                            source.URL = url;
                            source.ClaimType = SourceClaimType.Bias;
                            source.ClaimValue = (int)GetBias(doc.QuerySelector("h1 img").Attributes["src"].Value);
                            site.Sources.Add(source);
                            Console.WriteLine("Added Source for " + site.Name);
                        }

                        return site;
                    }
                    else
                    {
                        var site = new OrganizationSite();
                        site.Name = HttpUtility.HtmlDecode(doc.QuerySelector("h1.page-title").InnerHtml);
                        site.Domain = domain;
                        var notes = doc.QuerySelectorAll("div.entry-content p").Where(s => s.InnerText.Trim().ToLower().StartsWith("notes:"));
                        if (notes.Count() > 0)
                        {
                            site.OrganizationType = GetOrgType(notes.FirstOrDefault());
                            if (notes.FirstOrDefault().QuerySelectorAll("a").Any(s => s.Attributes["href"].Value.Contains("wikipedia")))
                            {
                                var wikiUrl = notes.FirstOrDefault().QuerySelectorAll("a").Where(s => s.Attributes["href"].Value.Contains("wikipedia")).FirstOrDefault().Attributes["href"].Value;
                                site.Description = GetWikipediaDescription(wikiUrl);
                                site.Wikipedia = wikiUrl;
                            }
                        }
                        
                        var source = new Source();
                        source.Organization = "Media Bias / Fact Check";
                        source.URL = url;
                        source.ClaimType = SourceClaimType.Bias;
                        source.ClaimValue = (int)GetBias(doc.QuerySelector("h1 img").Attributes["src"].Value);
                        site.Sources.Add(source);
                        Console.WriteLine("Loaded " + site.Name);
                        return site;
                    }
                }
                else
                {
                    return null;
                }
            } catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        private static Bias GetBias(string bias)
        {
            if (bias.Contains("leftcenter"))
            {
                return Bias.LeftCenter;
            }
            else if (bias.Contains("rightcenter"))
            {
                return Bias.RightCenter;
            }
            else if (bias.Contains("leastbiased"))
            {
                return Bias.Center;
            }
            else if (bias.Contains("extremeright") || bias.Contains("right11.png") || bias.Contains("right02.png") || bias.Contains("right03.png") || bias.Contains("right011.png"))
            {
                return Bias.ExtremeRight;
            }
            else if (bias.Contains("extremeleft") || bias.Contains("left1.png") || bias.Contains("left2.png") || bias.Contains("left3.png"))
            {
                return Bias.ExtremeLeft;
            }
            else if (bias.Contains("left"))
            {
                return Bias.Left;
            }
            else if (bias.Contains("right"))
            {
                return Bias.Right;
            } else
            {
                return Bias.Unknown;
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
            var rows = doc.DocumentNode.QuerySelectorAll("article p a");
            foreach(var row in rows)
            {
                var siteUrl = row.Attributes["href"].Value;
                if (siteUrl != null)
                {
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
            return _sites;
        }
    }
}
