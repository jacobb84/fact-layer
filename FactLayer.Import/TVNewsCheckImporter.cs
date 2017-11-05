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
    public class TVNewsCheckImporter : BaseImporter
    {
        private static OrganizationSite LoadSite(string url)
        {
            try
            {
                var doc = new HtmlAgilityPack.HtmlDocument();
                var request = (HttpWebRequest)WebRequest.Create(url);
                request.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:56.0) Gecko/20100101 Firefox/56.0";
                var response = (HttpWebResponse)request.GetResponse();
                string html;
                using (var sr = new StreamReader(response.GetResponseStream()))
                {
                    html = sr.ReadToEnd();
                }
                doc.LoadHtml(html);
                var domainLink = doc.QuerySelectorAll("#block-station div.block-content p.line-spacing a[target=_blank]").FirstOrDefault();
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
                        if (!site.Sources.Any(s => s.Organization == SourceOrganization.TVNewsCheck))
                        {
                            var source = new Source();
                            source.Organization = SourceOrganization.TVNewsCheck;
                            source.URL = url;
                            source.ClaimType = SourceClaimType.OrgType;
                            source.ClaimValue = (int)OrgType.NewsMedia;
                            site.Sources.Add(source);
                            Console.WriteLine("Added Source for " + site.Name);
                        }

                        return site;
                    }
                    else
                    {
                        var site = new OrganizationSite();
                        site.Name = HttpUtility.HtmlDecode(doc.QuerySelector("#block-station div.block-content h2.sifr").InnerHtml.Trim());
                        site.Domain = domain;
                        site.OrganizationType = OrgType.NewsMedia;
                        var wikiLink = doc.QuerySelectorAll("#block-station div.block-content p.line-spacing a[target=_blank]").Where(s => s.InnerText == "Wikipedia").FirstOrDefault();
                        if (wikiLink != null)
                        {
                            site.Wikipedia = wikiLink.Attributes["href"].Value;
                        }

                        var source = new Source();
                        source.Organization = SourceOrganization.TVNewsCheck;
                        source.URL = url;
                        source.ClaimType = SourceClaimType.OrgType;
                        source.ClaimValue = (int)OrgType.NewsMedia;
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
            var request = (HttpWebRequest)WebRequest.Create(url);
            request.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:56.0) Gecko/20100101 Firefox/56.0";
            var response = (HttpWebResponse)request.GetResponse();
            string html;
            using (var sr = new StreamReader(response.GetResponseStream()))
            {
                html = sr.ReadToEnd();
            }
            doc.LoadHtml(html);
            var rows = doc.DocumentNode.QuerySelectorAll("div.station-list div.dma ul li a");
            var resume = false;
            foreach (var row in rows)
            {
                var siteUrl = row.Attributes["href"].Value;
                if (siteUrl != null)
                {
                    if (resume)
                    {
                        var site = LoadSite("http://www.tvnewscheck.com" + siteUrl);
                        if (site != null && !_sites.Contains(site))
                        {
                            _sites.Add(site);
                        }
                    }

                    if (siteUrl == "/tv-station-directory/station/knmd-tv")
                    {
                        resume = true;
                    }

                }

            }
        }

        public static List<OrganizationSite> StartImport(List<OrganizationSite> sites)
        {
            ServicePointManager.Expect100Continue = true;
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            _sites = sites;
            Import("http://www.tvnewscheck.com/tv-station-directory/station");
            return _sites;
        }
    }
}
