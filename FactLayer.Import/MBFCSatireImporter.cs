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
    public class MBFCSatireImporter : BaseImporter
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
                var domainLink = doc.QuerySelectorAll("div.entry-content p a[target=_blank]").Where(s => s.InnerHtml == s.Attributes["href"].Value).FirstOrDefault();
                if (domainLink != null)
                {
                    var domain = ExtractDomainNameFromURL(domainLink.Attributes["href"].Value).Replace("www.", "");
                    if (_sites.Any(s => s.Domain.Equals(domain)))
                    {
                        var site = _sites.Where(s => s.Domain.Equals(domain)).Single();
                        site.OrganizationType = OrgType.Satire;
                        if (!site.Sources.Any(s => s.Organization == "Media Bias / Fact Check" && s.ClaimType == SourceClaimType.OrgType))
                        {
                            var source = new Source();
                            source.Organization = "Media Bias / Fact Check";
                            source.URL = url;
                            source.ClaimType = SourceClaimType.OrgType;
                            source.ClaimValue = (int)OrgType.Satire;
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
                        site.OrganizationType = OrgType.Satire;
                        var notes = doc.QuerySelectorAll("div.entry-content p").Where(s => s.InnerText.Trim().ToLower().StartsWith("notes:"));
                        if (notes.Count() > 0)
                        {
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
                        source.ClaimType = SourceClaimType.OrgType;
                        source.ClaimValue = (int)OrgType.Satire;
                        site.Sources.Add(source);
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
            Import("https://mediabiasfactcheck.com/satire/");
            return _sites;
        }
    }
}
