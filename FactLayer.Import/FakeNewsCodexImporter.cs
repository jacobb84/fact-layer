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
    public class FakeNewsCodexImporter : BaseImporter
    {
        private static List<OrganizationSite> _sites;
        public static void Import()
        {
            var doc = new HtmlAgilityPack.HtmlDocument();
            var request = (HttpWebRequest)WebRequest.Create("http://www.fakenewscodex.com/");
            var response = (HttpWebResponse)request.GetResponse();
            string html;
            using (var sr = new StreamReader(response.GetResponseStream()))
            {
                html = sr.ReadToEnd();
            }
            doc.LoadHtml(html);
            var rows = doc.DocumentNode.QuerySelectorAll("ul.list li");
            foreach(var row in rows)
            {
                var domain = ExtractDomainNameFromURL(row.QuerySelector("div.c-sites-list__url").InnerText);
                if (IgnoreUrl(domain))
                {
                    continue;
                }

                if (_sites.Any(s => s.Domain.Equals(domain)))
                {
                    var site = _sites.Where(s => s.Domain.Equals(domain)).Single();
                    if (row.Attributes["class"].Value.Contains("badge--fake"))
                    {
                        site.OrganizationType = OrgType.Fake;
                    } else if (row.Attributes["class"].Value.Contains("badge--satire") && site.OrganizationType != OrgType.Fake)
                    {
                        //Ignore if already fake, want fake to take precidence over satire in case there's conflicting opinions
                        site.OrganizationType = OrgType.Satire;
                    }
                    else
                    {
                        site.OrganizationType = OrgType.ExtremelyUnreliable;
                    }

                    if (site.Sources.Any(s => s.Organization == SourceOrganization.FakeNewsCodex && s.ClaimType == SourceClaimType.Veracity))
                    {
                        var source = site.Sources.Where(s => s.Organization == SourceOrganization.FakeNewsCodex && s.ClaimType == SourceClaimType.Veracity).Single();
                        if (row.Attributes["class"].Value.Contains("badge--fake"))
                        {
                            source.ClaimValue = (int)OrgType.Fake;
                        }
                        else if (row.Attributes["class"].Value.Contains("badge--satire"))
                        {
                            source.ClaimValue = (int)OrgType.Satire;
                        }
                        else
                        {
                            source.ClaimValue = (int)OrgType.ExtremelyUnreliable;
                        }
                        Console.WriteLine("Updating Source for " + site.Name);
                    }
                    else
                    {
                        var source = new Source();
                        source.Organization = SourceOrganization.FakeNewsCodex;
                        if (row.QuerySelector("a.read-more") != null)
                        {
                            source.URL = row.QuerySelector("a.read-more").Attributes["href"].Value;
                        }
                        else
                        {
                            //Try alternate method to get url
                            source.URL = row.QuerySelector("div.c-sites-list__image-container a").Attributes["href"].Value;
                        }
                        source.ClaimType = SourceClaimType.Veracity;
                        if (row.Attributes["class"].Value.Contains("badge--fake"))
                        {
                            source.ClaimValue = (int)OrgType.Fake;
                        }
                        else if (row.Attributes["class"].Value.Contains("badge--satire"))
                        {
                            source.ClaimValue = (int)OrgType.Satire;
                        } else
                        {
                            source.ClaimValue = (int)OrgType.ExtremelyUnreliable;
                        }

                            site.Sources.Add(source);
                        Console.WriteLine("Adding Source for " + site.Name);
                    }
                }
                else
                {
                    var site = new OrganizationSite();
                    site.Name = row.QuerySelector("a.c-sites-list__link").InnerText.Trim();
                    site.Domain = domain;
                    if (row.Attributes["class"].Value.Contains("badge--fake"))
                    {
                        site.OrganizationType = OrgType.Fake;
                    }
                    else if (row.Attributes["class"].Value.Contains("badge--satire"))
                    {
                        site.OrganizationType = OrgType.Satire;
                    }
                    else
                    {
                        site.OrganizationType = OrgType.ExtremelyUnreliable;
                    }


                    var source = new Source();
                    source.Organization = SourceOrganization.FakeNewsCodex;
                    if (row.QuerySelector("a.read-more") != null)
                    {
                        source.URL = row.QuerySelector("a.read-more").Attributes["href"].Value;
                    } else
                    {
                        //Try alternate method to get url
                        source.URL = row.QuerySelector("div.c-sites-list__image-container a").Attributes["href"].Value;
                    }
                    
                    source.ClaimType = SourceClaimType.Veracity;
                    if (row.Attributes["class"].Value.Contains("badge--fake"))
                    {
                        source.ClaimValue = (int)OrgType.Fake;
                    }
                    else if (row.Attributes["class"].Value.Contains("badge--satire"))
                    {
                        source.ClaimValue = (int)OrgType.Satire;
                    }
                    else
                    {
                        source.ClaimValue = (int)OrgType.ExtremelyUnreliable;
                    }
                    site.Sources.Add(source);

                    if (!_sites.Contains(site))
                    {
                        _sites.Add(site);
                    }

                    Console.WriteLine("Adding Entry for " + site.Name);
                }
            }
        }

        public static List<OrganizationSite> StartImport(List<OrganizationSite> sites)
        {
            ServicePointManager.Expect100Continue = true;
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            _sites = sites;
            Import();
            return _sites;
        }
    }
}
