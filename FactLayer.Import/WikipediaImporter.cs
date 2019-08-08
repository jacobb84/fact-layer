using FactLayer.Import.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FactLayer.Import
{
    public class WikipediaImporter : BaseImporter
    {
        public static List<OrganizationSite> StartImport(List<OrganizationSite> sites)
        {
            foreach(var site in sites)
            {
                if (!String.IsNullOrEmpty(site.Wikipedia))
                {
                    try
                    {
                        site.Description = GetWikipediaDescription(site.Wikipedia);
                        Console.WriteLine("Adding " + site.Name + " description.");
                    } catch (Exception ex)
                    {
                        Console.WriteLine(ex.Message);
                    }

                }
            }

            return sites;
        }
    }
}
