using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;

namespace FactLayer.Import
{
    public abstract class BaseImporter
    {

        protected static bool IgnoreUrl(string url)
        {
            if (url == "facebook.com"
                || url == "twitter.com"
                || url == "itunes.apple.com"
                || url == "yourcwtv.com"
                || url == "youtube.com"
                || url == "theaware.net" //no longer online
                || url == "mediabiasfactcheck.com"
                || url == "theearthchild.co.za" //Offline
                || url == null)
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
            else if (url == "edition.cnn.com")
            {
                return "cnn.com";
            }
            else if (url == "watchdog.org")
            {
                return "thecentersquare.com";
            }
            else if (url == "votesmart.org")
            {
                return "justfacts.votesmart.org";
            }
            else if (url == "qu.edu")
            {
                return "poll.qu.edu";
            }
            else if (url == "worldpoliticsus.com")
            {
                return "worldpoliticus.com";
            }
            else if (url == "addictinginfo.com")
            {
                return "addictinginfo.org";
            }
            else if (url == "chicksontheright.com")
            {
                return "chicksonright.com";
            }
            else if (url == "alternativemediasyndicate.com")
            {
                return "alternativemediasyndicate.net";
            }
            else if (url == "mystatesman.com")
            {
                return "statesman.com";
            }
            else if (url == "bluelivesmatter.blue")
            {
                return "policetribune.com";
            }
            else if (url == "dailystormer.com" || url == "dailystormer.name")
            {
                return "dailystormer.su";
            }
            else if (url == "dailyworldupdate.com")
            {
                return "dailystormer.su";
            }
            else if (url == "en.search.farsnews.com" || url == "farsnews.com" || url == "en.farsnews.com")
            {
                return "en.farsnews.ir";
            }
            else if (url == "business.financialpost.com")
            {
                return "financialpost.com";
            }
            else if (url == "ijr.org")
            {
                return "ijr.com";
            }
            else if (url == "kfbb.com")
            {
                return "montanarightnow.com";
            }
            else if (url == "neon-nettle.com")
            {
                return "neonnettle.com";
            }
            else if (url == "philly.com")
            {
                return "inquirer.com";
            }
            else if (url == "photographyisnotacrime.com")
            {
                return "pinacnews.com";
            }
            else if (url == "turningpoint.news")
            {
                return "tpusa.com";
            }
            else if (url == "myfoxnepa.com")
            {
                return "fox56.com";
            }
            else if (url == "yahoo.com")
            {
                return "news.yahoo.com";
            }
            else
            {
                return url;
            }
        }


        protected static string ExtractDomainNameFromURL(string Url)
        {
            if (String.IsNullOrEmpty(Url))
            {
                return null;
            }

            Url = Url.Replace(" ", "").Replace(",com",".com").Replace("`","");
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

            var firstParagraph = "";
            if (url.Contains("#"))
            {
                var fragment = url.Split('#')[1];
                var anchorNode = doc.GetElementbyId(fragment);
                if (anchorNode != null)
                {
                    firstParagraph = anchorNode.ParentNode.NextSiblingElement().InnerText;
                }
            } else
            {
                firstParagraph = doc.QuerySelectorAll("div.mw-parser-output > p:not(.mw-empty-elt)").Where(s => !s.InnerText.Trim().ToLower().StartsWith("coordinates")).FirstOrDefault().InnerText;
            }
            
            firstParagraph = HttpUtility.HtmlDecode(firstParagraph);
            //Strip out links / citations
            firstParagraph = Regex.Replace(firstParagraph, @"\[(\d*|\w?)\]", "");
            firstParagraph = firstParagraph.Replace("[citation needed]", "");
            firstParagraph = firstParagraph.Replace("[better source needed]", "");
            firstParagraph = firstParagraph.Replace("[update]", "");
            firstParagraph = firstParagraph.Replace("\n", "");

            return Ellipsis(firstParagraph, 400);

        }
    }
}
