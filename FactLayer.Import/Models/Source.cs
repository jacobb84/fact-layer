using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FactLayer.Import.Models
{
    public class Source
    {
        public SourceOrganization Organization { get; set; }
        public string URL { get; set; }
        public SourceClaimType ClaimType { get; set; }
        public int ClaimValue { get; set; }
    }
}
