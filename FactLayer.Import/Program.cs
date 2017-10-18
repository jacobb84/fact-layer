using FactLayer.Import.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FactLayer.Import
{
    class Program
    {
        static void Main(string[] args)
        {
            string json = File.ReadAllText("org_sites.json");
            var sites = JsonConvert.DeserializeObject<List<OrganizationSite>>(json);
            sites = AllSidesImporter.StartImport(sites);
            sites = MBFCImporter.StartImport(sites);
            sites = MBFCFakeImporter.StartImport(sites);
            sites = MBFCSatireImporter.StartImport(sites);
            sites = RealOrSatireImporter.StartImport(sites);
            sites = WikipediaImporter.StartImport(sites);
            sites = sites.OrderBy(s => s.Domain).ToList();
            string output = JsonConvert.SerializeObject(sites);
            var file = File.CreateText("org_sites.json");
            file.Write(output);
            file.Flush();
            file.Close();
        }
    }
}
