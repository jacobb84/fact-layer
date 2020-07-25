using FactLayer.Import.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FactLayer.Import
{
    class Program
    {
        static void WriteFile(List<OrganizationSite> sites)
        {
            var file = File.CreateText("org_sites.1.3.json");
            file.Write(JsonConvert.SerializeObject(sites));
            file.Flush();
            file.Close();
        }
        static void Main(string[] args)
        {
            string json = File.ReadAllText("org_sites.1.3.json");
            var sites = JsonConvert.DeserializeObject<List<OrganizationSite>>(json);
            //sites = CharityNavigatorImporter.StartImport(sites);
            //sites = AllSidesImporter.StartImport(sites);
            //WriteFile(sites);
            //sites = MBFCImporter.StartImport(sites);
            //sites = MBFCScienceImporter.StartImport(sites);
           // WriteFile(sites);
            //sites = MBFCFakeImporter.StartImport(sites);
            ///sites = MBFCSatireImporter.StartImport(sites);
           // WriteFile(sites);
            //sites = RealOrSatireImporter.StartImport(sites);
            //sites = FakeNewsCodexImporter.StartImport(sites);
            //sites = TVNewsCheckImporter.StartImport(sites);
            //sites = OpenSourcesImporter.StartImport(sites);
            //WriteFile(sites);
            sites = WikipediaImporter.StartImport(sites);
            sites = sites.OrderBy(s => s.Domain, StringComparer.Ordinal).ToList();
            WriteFile(sites);
        }
    }
}
