using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace FactLayer.Import
{
    public abstract class BaseImporter
    {

        protected static bool IgnoreUrl(string url)
        {
            if (url == "facebook.com"
                || url == "twitter.com"
                || url == "itunes.apple.com")
            {
                return true;
            }
            return false;
        }

        protected static string NormalizeUrl(string url)
        {
            if (url == "apnews.com")
            {
                return "ap.org";
            }
            else if (url == "cbs.com")
            {
                return "cbsnews.com";
            }
            else if (url == "en.search.farsnews.com")
            {
                return "farsnews.com";
            }
            else if (url == "eng.majalla.com")
            {
                return "majalla.com";
            }
            else if (url == "front.moveon.org")
            {
                return "moveon.org";
            }
            else if (url == "7online.com")
            {
                return "abc7ny.com";
            }
            else
            {
                return url;
            }
        }


        protected static string ExtractDomainNameFromURL(string Url)
        {
            if (!Url.Contains("://"))
                Url = "http://" + Url;

            var host = new Uri(Url).Host.Replace("www.", "");

            return NormalizeUrl(host);
        }

        static private string Ellipsis(string text, int length)
        {
            if (text.Length <= length) return text;
            int pos = text.IndexOf(" ", length);
            if (pos >= 0)
                return text.Substring(0, pos) + "...";
            return text;
        }

        protected static string GetWikipediaDescription(string url)
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

            var firstParagraph = doc.QuerySelectorAll("div.mw-parser-output > p").Where(s => !s.InnerText.ToLower().StartsWith("coordinates")).FirstOrDefault().InnerText;
            //Strip out links / citations
            firstParagraph = Regex.Replace(firstParagraph, @"\<[a|sup|/a|/sup].*\>", "");
            firstParagraph = Regex.Replace(firstParagraph, @"\[\d*\]", "");
            firstParagraph = firstParagraph.Replace("[citation needed]", "");
            firstParagraph = firstParagraph.Replace("[better&#160;source&#160;needed]", "");

            return Ellipsis(firstParagraph, 400);

        }
    }
}
