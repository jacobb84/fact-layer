using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FactLayer.Import.Models
{
    public enum SourceClaimType
    {
        Other = 1000,
        Bias = 0,
        Veracity = 1,
        CharityRating = 2,
        Factuality = 3,
        OrgType = 4
    }

    public enum SourceOrganization
    {
        Self = -1,
        AllSides = 0,
        MBFC = 1,
        RealOrSatire = 2,
        CharityNavigator = 3,
        FakeNewsCodex = 4,
        DukeReportersLab = 5,
        TVNewsCheck = 6
    }
}
