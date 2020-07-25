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
    public class RealOrSatireImporter : BaseImporter
    {
        private static List<OrganizationSite> _sites;
        public static void Import(string url, int currentPage)
        {
            var doc = new HtmlAgilityPack.HtmlDocument();
            var request = (HttpWebRequest)WebRequest.Create(string.Format(url, currentPage));
            request.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:56.0) Gecko/20100101 Firefox/56.0";
            var response = (HttpWebResponse)request.GetResponse();
            string html;
            using (var sr = new StreamReader(response.GetResponseStream()))
            {
                html = sr.ReadToEnd();
            }
            doc.LoadHtml(html);
            var rows = doc.DocumentNode.QuerySelectorAll("#primary article:not(.category-real)");
            foreach(var row in rows)
            {
                var domain = ExtractDomainNameFromURL(row.QuerySelector("h2.entry-title").InnerText);
                if (IgnoreUrl(domain))
                {
                    continue;
                }
                var orgType = OrgType.Satire;
                if (row.Attributes["class"].Value.Contains("category-clickbait"))
                {
                    orgType = OrgType.ClickBait;
                }
                if (_sites.Any(s => s.Domain.Equals(domain)))
                {
                    var site = _sites.Where(s => s.Domain.Equals(domain)).Single();
  
                    if (!site.Sources.Any(s => s.Organization == SourceOrganization.RealOrSatire && s.ClaimType == SourceClaimType.Veracity))
                    {
                        var source = new Source();
                        source.Organization = SourceOrganization.RealOrSatire;
                        source.URL = row.QuerySelector("h2.entry-title a").Attributes["href"].Value;
                        source.ClaimType = SourceClaimType.Veracity;
                        source.ClaimValue = (int)orgType;
                        site.Sources.Add(source);
                    }
                } else
                {
                    var site = new OrganizationSite();
                    site.Name = domain;
                    site.Domain = domain;
                    site.OrganizationType = orgType;
                    
                    var source = new Source();
                    source.Organization = SourceOrganization.RealOrSatire;
                    source.URL = row.QuerySelector("h2.entry-title a").Attributes["href"].Value;
                    source.ClaimType = SourceClaimType.Veracity;
                    source.ClaimValue = (int)orgType;
                    site.Sources.Add(source);

                    if (!_sites.Contains(site))
                    {
                        _sites.Add(site);
                    }
                }
            }

            if (doc.QuerySelector("div.nav-previous") != null)
            {
                Import(url, ++currentPage);
            }
        }

        public static List<OrganizationSite> StartImport(List<OrganizationSite> sites)
        {
            ServicePointManager.Expect100Continue = true;
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            _sites = sites;
            Import("http://realorsatire.com/websites-that-are/satire/page/{0}/", 1);
            Import("http://realorsatire.com/websites-that-are/clickbait/page/{0}/", 1);
            return _sites;
        }
    }
}
