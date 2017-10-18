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
        protected static string ExtractDomainNameFromURL(string Url)
        {
            if (!Url.Contains("://"))
                Url = "http://" + Url;

            return new Uri(Url).Host;
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

            var firstParagraph = doc.QuerySelector("div.mw-parser-output > p").InnerText;
            //Strip out links / citations
            firstParagraph = Regex.Replace(firstParagraph, @"\<[a|sup|/a|/sup].*\>", "");
            firstParagraph = Regex.Replace(firstParagraph, @"\[\d*\]", "");
            return Ellipsis(firstParagraph, 400);

        }
    }
}
