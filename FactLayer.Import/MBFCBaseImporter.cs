using FactLayer.Import.Models;
using HtmlAgilityPack;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace FactLayer.Import
{
    public class MBFCBaseImporter : BaseImporter
    {
        protected static HtmlNode getDomain(HtmlDocument doc, string siteName)
        {
            var domainLink = doc.QuerySelectorAll("div.entry-content p a[target=_blank]").Where(s => s.Attributes["href"] != null && NormalizeLink(s.InnerHtml) == NormalizeLink(s.Attributes["href"].Value)).LastOrDefault();
            if (domainLink == null)
            {
                domainLink = doc.QuerySelectorAll("div.entry-content p a").Where(s => s.InnerHtml == siteName || (s.Attributes["href"] != null && NormalizeLink(s.InnerHtml) == NormalizeLink(s.Attributes["href"].Value))).LastOrDefault();
            }

            if (domainLink == null)
            {
                domainLink = doc.QuerySelectorAll("div.entry-content table a").Where(s => s.InnerHtml == siteName || (s.Attributes["href"] != null && NormalizeLink(s.InnerHtml) == NormalizeLink(s.Attributes["href"].Value))).LastOrDefault();
            }

            if (domainLink == null)
            {
                domainLink = doc.QuerySelectorAll("div.entry-content p a").Where(s => s.InnerHtml == "about page").LastOrDefault();
            }

            //Weird articles that don't follow standard naming conventions
            if (domainLink == null)
            {
                if (siteName == "Philly Voice")
                {
                    domainLink = doc.QuerySelectorAll("div.entry-content p a").Where(s => s.Attributes["href"].Value.StartsWith("https://www.phillyvoice.com")).FirstOrDefault();
                }
                else if (siteName == "WAMU-FM")
                {
                    domainLink = doc.QuerySelectorAll("div.entry-content p a").Where(s => s.Attributes["href"].Value.StartsWith("https://wamu.org")).FirstOrDefault();
                }
                else if (siteName == "Algemeen Dagblad")
                {
                    domainLink = doc.QuerySelectorAll("div.entry-content p a").Where(s => s.Attributes["href"].Value.StartsWith("https://www.ad.nl")).FirstOrDefault();
                }
                else if (siteName == "APTN News")
                {
                    domainLink = doc.QuerySelectorAll("div.entry-content p a").Where(s => s.Attributes["href"].Value.StartsWith("http://aptnnews.ca")).FirstOrDefault();
                }
                else if (siteName == "Elko Daily Free Press")
                {
                    domainLink = doc.QuerySelectorAll("div.entry-content p a").Where(s => s.Attributes["href"].Value.StartsWith("https://elkodaily.com")).FirstOrDefault();
                }
                else if (siteName == "Kompas.com")
                {
                    domainLink = doc.QuerySelectorAll("div.entry-content p a").Where(s => s.Attributes["href"].Value.StartsWith("https://www.kompas.com")).FirstOrDefault();
                }
                else if (siteName == "Roanoke Times")
                {
                    domainLink = doc.QuerySelectorAll("div.entry-content p a").Where(s => s.Attributes["href"].Value.StartsWith("https://www.kompas.com")).FirstOrDefault();
                }
                else if (siteName == "Il Giornale")
                {
                    domainLink = doc.QuerySelectorAll("div.entry-content p a").Where(s => s.Attributes["href"].Value.StartsWith("https://www.ilgiornale.it")).FirstOrDefault();
                }
                else if (siteName == "Chicks on the Right")
                {
                    domainLink = doc.QuerySelectorAll("div.entry-content p a").Where(s => s.Attributes["href"].Value.StartsWith("http://www.chicksontheright.com")).FirstOrDefault();
                }
                else if (siteName == "CBS Los Angeles (KCBS)")
                {
                    domainLink = doc.QuerySelectorAll("div.entry-content p a").Where(s => s.Attributes["href"].Value.StartsWith("https://losangeles.cbslocal.com")).LastOrDefault();
                }
                else if (siteName == "Alt-Right TV")
                {
                    //Make a fake link node since they don't direct link to site
                    domainLink = doc.QuerySelectorAll("div.entry-content a").LastOrDefault();
                    domainLink.Attributes["href"].Value = "https://altrighttv.com/";
                }
                else if (siteName == "America Max News")
                {
                    domainLink = doc.QuerySelectorAll("div.entry-content div a").Where(s => s.Attributes["href"].Value.StartsWith("https://www.americamaxnews.com")).LastOrDefault();
                }
            }


            return domainLink;
        }


        protected static string NormalizeLink(string htmlString)
        {
            string pattern = @"<(.|\n)*?>";
            //trim html tags and normalize link
            string url = Regex.Replace(htmlString, pattern, string.Empty).Replace("https://", "").Replace("http://", "").Replace("ttps://", "").Replace("www.","").ToLower();
            //Make sure to only pull in root
            url = url.Split('/')[0];
            return url.Trim().TrimEnd('#');
        }

        protected static Bias GetBias(HtmlDocument doc)
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

            if (biasImage != null)
            {
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
            }

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

        protected static string NormalizeSiteUrl(string siteUrl)
        {
            if (!siteUrl.StartsWith("http"))
            {
                siteUrl = "https://mediabiasfactcheck.com" + siteUrl;
            }

            //Bad link on the table
            if (siteUrl == "http://newsservis.com/")
            {
                siteUrl = "https://mediabiasfactcheck.com/newsservis-com/";
            } 
            else if (siteUrl == "https://lawandcrime.com/") 
            {
                siteUrl = "https://mediabiasfactcheck.com/law-newz/";
            }
            else if (siteUrl == "https://alohastatenews.com/")
            {
                siteUrl = "https://mediabiasfactcheck.com/aloha-state-news/";
            }
            else if (siteUrl == "https://swgeorgianews.com/")
            {
                siteUrl = "https://mediabiasfactcheck.com/sw-georgia-news/";
            }
            return siteUrl;
        }

    }
}
