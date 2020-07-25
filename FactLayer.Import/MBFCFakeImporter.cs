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

namespace FactLayer.Import
{
    public class MBFCFakeImporter : BaseImporter
    {
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
                var domainLink = doc.QuerySelectorAll("div.entry p a[target=_blank]").Where(s => s.InnerHtml.Replace("https://","").Replace("http://","") == s.Attributes["href"].Value.Replace("https://", "").Replace("http://", "")).FirstOrDefault();
                if (domainLink == null)
                {
                    domainLink = doc.QuerySelectorAll("div.entry p a").Where(s => s.InnerHtml == siteName || (s.Attributes["href"] != null && (s.InnerHtml.Trim() == s.Attributes["href"].Value.Trim().TrimEnd('#') || s.InnerHtml.Trim() == s.Attributes["href"].Value.Replace("http://","").Trim()))).FirstOrDefault();
                    Console.WriteLine("Attempting match with secondary lookup");
                }
                if (domainLink != null)
                {
                    var domain = ExtractDomainNameFromURL(domainLink.Attributes["href"].Value);
                    if (IgnoreUrl(domain))
                    {
                        return null;
                    }

                    //Start by defaulting based on fact reporting
                    OrgType orgType = OrgType.ExtremelyUnreliable;
                    var factRating = doc.QuerySelectorAll("div.entry-content p").Where(s => s.InnerText.Trim().ToLower().StartsWith("factual reporting:")).FirstOrDefault();
                    if (factRating == null)
                    {
                        factRating = doc.QuerySelectorAll("div.entry p").Where(s => s.InnerText.Trim().ToLower().StartsWith("factual reporting:")).FirstOrDefault();
                    }

                    if (factRating != null)
                    {
                        if (factRating.InnerText.ToLower().Contains("very low"))
                        {
                            orgType = OrgType.Fake;
                        }
                    }

                    //Examine the reasoning, and adjust based on listed answers.
                    var biases = doc.QuerySelectorAll("div.entry-content p").Where(s => s.InnerText.Trim().ToLower().StartsWith("reasoning:")).FirstOrDefault();

                    if (biases != null && (biases.InnerText.ToLower().Contains("fake news")))
                    {
                        orgType = OrgType.Fake;
                    }

                    if (biases != null && (biases.InnerText.ToLower().Contains("some fake news")))
                    {
                        orgType = OrgType.ExtremelyUnreliable;
                    }

                    if ((biases != null && (biases.InnerText.ToLower().Contains("hate group") || biases.InnerText.ToLower().Contains("anti-lgbt") || biases.InnerText.ToLower().Contains("anti-islam"))))
                    {
                        orgType = OrgType.HateGroup;
                    }                    

                    if (_sites.Any(s => s.Domain.Equals(domain)))
                    {
                        var site = _sites.Where(s => s.Domain.Equals(domain)).Single();
                        site.Sources.RemoveAll(s => s.Organization == SourceOrganization.MBFC && s.ClaimType == SourceClaimType.Veracity);
                        site.OrganizationType = orgType;
                        if (!site.Sources.Any(s => s.Organization == SourceOrganization.MBFC && s.ClaimType == SourceClaimType.Veracity) && (orgType == OrgType.Fake || orgType == OrgType.ExtremelyUnreliable))
                        {
                            
                            var source = new Source();
                            source.Organization = SourceOrganization.MBFC;
                            source.URL = url;
                            source.ClaimType = SourceClaimType.Veracity;
                            source.ClaimValue = (int)orgType;
                            site.Sources.Add(source);
                            Console.WriteLine("Added Veracity Source for " + site.Name);
                        } 

                        if (!site.Sources.Any(s => s.Organization == SourceOrganization.MBFC && s.ClaimType == SourceClaimType.OrgType) && orgType == OrgType.HateGroup)
                        {
                            var source = new Source();
                            source.Organization = SourceOrganization.MBFC;
                            source.URL = url;
                            source.ClaimType = SourceClaimType.OrgType;
                            source.ClaimValue = (int)OrgType.HateGroup;
                            site.Sources.Add(source);
                            Console.WriteLine("Added Org Type Source for " + site.Name);
                        }
                        
                        if (site.Sources.Any(s => s.Organization == SourceOrganization.MBFC && s.ClaimType == SourceClaimType.Bias))
                        {
                            var source = site.Sources.Where(s => s.Organization == SourceOrganization.MBFC && s.ClaimType == SourceClaimType.Bias).Single();
                            source.ClaimValue = (int)GetBias(doc);
                            Console.WriteLine("Updating Bias Source for " + site.Name);
                        }
                        else
                        {
                            if (GetBias(doc) != Bias.Unknown)
                            {
                                var source = new Source();
                                source.Organization = SourceOrganization.MBFC;
                                source.URL = url;
                                source.ClaimType = SourceClaimType.Bias;
                                source.ClaimValue = (int)GetBias(doc);
                                site.Sources.Add(source);
                                Console.WriteLine("Added Bias Source for " + site.Name);
                            }
                        }

                        return site;
                    }
                    else
                    {
                        var site = new OrganizationSite();
                        site.Name = siteName;
                        site.Domain = domain;
                        site.OrganizationType = orgType;
                        var notes = doc.QuerySelectorAll("div.entry-content p").Where(s => s.InnerText.Trim().ToLower().StartsWith("notes:"));
                        if (notes.Count() > 0)
                        {
                            if (notes.FirstOrDefault().QuerySelectorAll("a").Any(s => s.Attributes["href"].Value.Contains("wikipedia")))
                            {
                                var wikiUrl = notes.FirstOrDefault().QuerySelectorAll("a").Where(s => s.Attributes["href"].Value.Contains("wikipedia")).FirstOrDefault().Attributes["href"].Value;
                                site.Wikipedia = wikiUrl;
                            }
                        }

                        if (GetBias(doc) != Bias.Unknown)
                        {
                            var source = new Source();
                            source.Organization = SourceOrganization.MBFC;
                            source.URL = url;
                            source.ClaimType = SourceClaimType.Bias;
                            source.ClaimValue = (int)GetBias(doc);
                            site.Sources.Add(source);
                        }


                        if (orgType == OrgType.Fake || orgType == OrgType.ExtremelyUnreliable)
                        {
                            var source = new Source();
                            source.Organization = SourceOrganization.MBFC;
                            source.URL = url;
                            source.ClaimType = SourceClaimType.Veracity;
                            source.ClaimValue = (int)orgType;
                            site.Sources.Add(source);
                        }
                        else if (orgType == OrgType.HateGroup)
                        {
                            var source = new Source();
                            source.Organization = SourceOrganization.MBFC;
                            source.URL = url;
                            source.ClaimType = SourceClaimType.OrgType;
                            source.ClaimValue = (int)OrgType.HateGroup;
                            site.Sources.Add(source);
                        }

                        Console.WriteLine("Loaded " + site.Name);
                        return site;
                    }
                }
                else
                {
                    return null;
                }
            } catch (Exception)
            {
                return null;
            }
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
            }
            else
            {
                //Can't give up yet, try to parse out of reasoning the text
                var biases = doc.QuerySelectorAll("div.entry-content p").Where(s => s.InnerText.Trim().ToLower().StartsWith("reasoning:")).FirstOrDefault();
                if (biases != null)
                {
                    if (biases.InnerText.ToLower().Contains("extreme right"))
                    {
                        return Bias.ExtremeRight;
                    }
                    else if (biases.InnerText.ToLower().Contains("extreme left"))
                    {
                        return Bias.ExtremeLeft;
                    }
                }

                //We're still here, try to parse out of the summary text
                biases = doc.QuerySelectorAll("div.entry-content li strong").FirstOrDefault();
                if (biases != null)
                {
                    if (biases.InnerText.ToLower().Contains("extreme right"))
                    {
                        return Bias.ExtremeRight;
                    }
                    else if (biases.InnerText.ToLower().Contains("extreme left"))
                    {
                        return Bias.ExtremeLeft;
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
            foreach (var row in rows)
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
            Import("https://mediabiasfactcheck.com/fake-news/");
            Import("https://mediabiasfactcheck.com/conspiracy/");

            return _sites;
        }
    }
}
