﻿using FactLayer.Import.Models;
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
                var siteName = HttpUtility.HtmlDecode(doc.QuerySelector("h1.page-title").InnerHtml);
                var domainLink = doc.QuerySelectorAll("div.entry-content p a[target=_blank]").Where(s => s.Attributes["href"] != null && NormalizeLink(s.InnerHtml) == NormalizeLink(s.Attributes["href"].Value)).FirstOrDefault();
                if (domainLink == null)
                {
                    domainLink = doc.QuerySelectorAll("div.entry-content p a").Where(s => s.InnerHtml == siteName || (s.Attributes["href"] != null && NormalizeLink(s.InnerHtml) == NormalizeLink(s.Attributes["href"].Value))).FirstOrDefault();
                }
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

        public static string NormalizeLink(string htmlString)
        {
            string pattern = @"<(.|\n)*?>";
            return Regex.Replace(htmlString, pattern, string.Empty).Replace("https://", "").Replace("http://", "").ToLower().Trim();
        }

        private static Bias GetBias(HtmlDocument doc)
        {
            var biasImage = doc.QuerySelector("h1 img");
            if (biasImage == null)
            {
                biasImage = doc.QuerySelector("h2.entry-title img");
            }
            if (biasImage == null)
            {
                biasImage = doc.QuerySelector("h2 img");
            }
            if (biasImage == null)
            {
                biasImage = doc.QuerySelector("div.entry-content > p > img.aligncenter");
            }
            if (biasImage == null)
            {
                biasImage = doc.QuerySelector("div.entry-content > header > img.aligncenter");
            }

            var bias = biasImage.Attributes["src"].Value;

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
            else if (bias.Contains("extremeright") || bias.Contains("right11.png") || bias.Contains("right02.png") || bias.Contains("right03.png") || bias.Contains("right01.png") || bias.Contains("right011.png"))
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
                //We're still here, try to parse out of the summary text
                var biases = doc.QuerySelectorAll("div.entry-content li strong").FirstOrDefault();
                if (biases != null)
                {
                    if (biases.InnerText.ToLower().Contains("left center"))
                    {
                        return Bias.LeftCenter;
                    }
                    else if (biases.InnerText.ToLower().Contains("right center"))
                    {
                        return Bias.RightCenter;
                    }
                    else if (biases.InnerText.ToLower().Contains("least biased"))
                    {
                        return Bias.Center;
                    }
                    else if (biases.InnerText.ToLower().Contains("extreme right"))
                    {
                        return Bias.ExtremeRight;
                    }
                    else if (biases.InnerText.ToLower().Contains("extreme left"))
                    {
                        return Bias.ExtremeLeft;
                    }
                    else if (biases.InnerText.ToLower().Contains("right"))
                    {
                        return Bias.Right;
                    }
                    else if (biases.InnerText.ToLower().Contains("left"))
                    {
                        return Bias.Left;
                    }
                }


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
            var rows = doc.DocumentNode.QuerySelectorAll("table.sort a");
            foreach(var row in rows)
            {
                var siteUrl = row.Attributes["href"].Value;
                if (siteUrl != null)
                {
                    if (!siteUrl.StartsWith("http"))
                    {
                        siteUrl = "https://mediabiasfactcheck.com" + siteUrl;
                    }

                    //Bad link on the table
                    if (siteUrl == "https://lawandcrime.com/")
                    {
                        siteUrl = "https://mediabiasfactcheck.com/law-newz/";
                    }
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
