using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FactLayer.Import.Models
{
    public class OrganizationSite
    {
        public OrganizationSite()
        {
            Sources = new List<Source>();
        }
        public OrgType OrganizationType { get; set; }
        public string Name { get; set; }
        public string Wikipedia { get; set; }
       /* public Bias Bias
        {
            get
            {
                if (Sources.Count > 0)
                {
                    //Get the average
                    double totalBias = 0;
                    foreach(var source in Sources.Where(s => s.ClaimType == SourceClaimType.Bias))
                    {
                        totalBias += source.ClaimValue;
                    }

                    if (totalBias < 0)
                    {
                        return (Bias)Math.Floor(totalBias / Sources.Count(s => s.ClaimType == SourceClaimType.Bias));
                    } else
                    {
                        return (Bias)Math.Ceiling(totalBias / Sources.Count(s => s.ClaimType == SourceClaimType.Bias));
                    }
                } else
                {
                    return Bias.Unknown;
                }
            }
        }*/
        public string Description { get; set; }
        public string Domain { get; set; }
        public List<Source> Sources { get; set; }

        public override int GetHashCode()
        {
            return base.GetHashCode();
        }
        public override bool Equals(object obj)
        {
            var compareToObj = obj as OrganizationSite;
            if (compareToObj != null)
            {
                return compareToObj.Domain.Equals(this.Domain);
            } else
            {
                return false;
            }
        }
    }
}
