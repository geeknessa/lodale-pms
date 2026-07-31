import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, BedDouble, Bath, Wrench, User, Wallet, Calendar, Sliders, PenSquare } from "lucide-react";
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import { LISTINGS } from "../data/listings";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);

  // State to simulate management toggles
  const [isAcceptingApps, setIsAcceptingApps] = useState(true);
  const [tenantsMap, setTenantsMap] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem("properties");
    const list = saved ? JSON.parse(saved) : LISTINGS;
    const item = list.find((p) => p.id === id) || list[0];
    setProperty(item);
  }, [id]);

  useEffect(() => {
    const saved = localStorage.getItem("propertyTenants");
    if (saved) {
      setTenantsMap(JSON.parse(saved));
    }
  }, []);

  if (!property) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar />
        <div className="flex h-96 items-center justify-center">
          <p className="text-ink-700">Loading property details...</p>
        </div>
      </div>
    );
  }

  // Determine dynamic occupancy and maintenance details based on property ID
  const isSkyline = property.id.includes("skyline");
  const isOakwood = property.id.includes("oakwood");
  const isLekki = property.id.includes("lekki");

  const propertyTenants = tenantsMap[property.id] || [];
  const hasTenant = propertyTenants.length > 0;
  const tenantInfo = hasTenant ? {
    name: propertyTenants[0].name,
    avatar: propertyTenants[0].avatar,
    lease: propertyTenants[0].leaseStatus,
    score: propertyTenants[0].reliabilityScore,
  } : null;

  const occupancyStatus = hasTenant ? "Occupied" : "Vacant";

  let maintenanceLogs = [];

  if (isSkyline) {
    maintenanceLogs = [
      {
        id: 1,
        type: "Repair",
        details: "Fix bedroom AC unit blowing warm air",
        status: "Pending",
        date: "Today, 09:30 AM",
      },
    ];
  } else if (isOakwood) {
    maintenanceLogs = [
      {
        id: 2,
        type: "Upgrade",
        details: "Upgrade kitchen plumbing & sink setup",
        status: "In Progress",
        date: "Yesterday, 02:15 PM",
      },
    ];
  } else if (isLekki) {
    maintenanceLogs = [
      {
        id: 3,
        type: "Repair",
        details: "Fix master bedroom window lock",
        status: "Completed",
        date: "July 18, 2026",
      },
    ];
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-16">
      <NavBar />

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard/landlord")}
          className="mb-6 flex items-center gap-2 text-[13px] font-semibold text-moss-700 hover:text-moss-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        {/* Hero Visual Panel */}
        <div className="flex h-64 items-center justify-center rounded-2xl bg-[#E4EAE1] border border-ink-200/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-white/10 to-[#2C4633]/5 pointer-events-none" />
          <Building2 className="h-16 w-16 text-[#2C4633]/25" />
          <span className="absolute bottom-4 left-6 rounded-full bg-[#2C4633] px-3.5 py-1.5 text-[11px] font-bold text-white uppercase tracking-wider">
            {occupancyStatus}
          </span>
        </div>

        {/* Grid Layout */}
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_360px]">
          {/* LEFT COLUMN: Property Spec Details */}
          <div className="space-y-8">
            <div className="rounded-2xl border border-ink-200/50 bg-white p-6 shadow-sm text-left">
              <h1 className="font-display text-2xl font-bold text-ink-900">
                {property.title}
              </h1>
              <p className="mt-1.5 text-[14.5px] text-ink-700">{property.location}</p>

              <div className="mt-6 flex items-center gap-5 border-t border-b border-ink-200/30 py-4 text-[13.5px] text-ink-700">
                <span className="flex items-center gap-1.5 font-medium">
                  <BedDouble className="h-4.5 w-4.5 text-moss-600" /> {property.beds} Bedrooms
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Bath className="h-4.5 w-4.5 text-moss-600" /> {property.baths} Bathrooms
                </span>
              </div>

              <div className="mt-6">
                <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-ink-400 mb-3">
                  Property Amenities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <span
                      key={a}
                      className="rounded-lg bg-cream-50 border border-ink-200/40 px-3.5 py-1.5 text-[12px] font-semibold text-ink-700"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Maintenance Work Logs */}
            <div className="rounded-2xl border border-ink-200/50 bg-white p-6 shadow-sm text-left">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-ink-400">
                  Maintenance History
                </h3>
                <span className="text-[12px] font-semibold text-[#2C4633] bg-[#E4EAE1] px-2.5 py-1 rounded-full">
                  {maintenanceLogs.length} total
                </span>
              </div>

              {maintenanceLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink-200/70 p-8 text-center text-ink-700">
                  <Wrench className="mx-auto h-8 w-8 text-ink-400/55 mb-2" />
                  <p className="text-[13px]">No maintenance requests filed for this property.</p>
                </div>
              ) : (
                <div className="divide-y divide-ink-200/30">
                  {maintenanceLogs.map((log) => (
                    <div key={log.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13px] font-bold text-ink-900">{log.type}</span>
                          <span className="text-[11px] text-ink-400">• {log.date}</span>
                        </div>
                        <p className="text-[12.5px] text-ink-750">{log.details}</p>
                      </div>
                      <span className={`request-status-badge ${log.status.toLowerCase().replace(" ", "-")}`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Landlord Administration Panel */}
          <div className="space-y-6 text-left">
            {/* Occupancy Card */}
            <div className="rounded-2xl border border-ink-200/50 bg-white p-6 shadow-sm">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-ink-400">
                Occupancy & Lease
              </h3>

              {tenantInfo ? (
                <div className="mt-4 flex items-center gap-3.5">
                  <img
                    src={tenantInfo.avatar}
                    alt={tenantInfo.name}
                    className="h-12 w-12 rounded-full object-cover border border-ink-200"
                  />
                  <div>
                    <div className="text-[14px] font-bold text-ink-900">
                      {tenantInfo.name}
                    </div>
                    <div className="text-[12px] text-ink-400">
                      {tenantInfo.lease}
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-[#D69E2E]">
                      ★ {tenantInfo.score} Trust Score
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-ink-700">
                    <User className="h-5 w-5 text-ink-400" />
                    <span className="text-[13px]">No active lease on this unit.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Overview Card */}
            <div className="rounded-2xl border border-ink-200/50 bg-white p-6 shadow-sm">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-ink-400 mb-4">
                Financial Performance
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-moss-100 text-moss-700">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-[11px] text-ink-400 font-semibold uppercase">
                      Expected Rent
                    </span>
                    <span className="text-[16px] font-bold text-ink-900">
                      {property.price.includes("/mo") ? property.price.split("/mo")[0] : property.price}
                      <span className="text-[11px] text-ink-400 font-medium"> / Month</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-ink-200/30 pt-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-moss-100 text-moss-700">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-[11px] text-ink-400 font-semibold uppercase">
                      Payout Cycle
                    </span>
                    <span className="text-[13.5px] font-bold text-ink-900">
                      Auto-Transfer (24h)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Management Controls */}
            <div className="rounded-2xl border border-ink-200/50 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-ink-400">
                Management Actions
              </h3>

              <div className="flex flex-col gap-2.5">
                <Button
                  onClick={() => {
                    setIsAcceptingApps(!isAcceptingApps);
                    alert(isAcceptingApps ? "Applications paused for this property." : "Applications active for this property.");
                  }}
                  variant={isAcceptingApps ? "primary" : "secondary"}
                  className="w-full text-[12.5px] py-2.5 cursor-pointer"
                >
                  {isAcceptingApps ? "Pause Applications" : "Activate Applications"}
                </Button>

                <Button
                  onClick={() => alert("Form to log a new maintenance work order is under construction.")}
                  variant="secondary"
                  className="w-full text-[12.5px] py-2.5 gap-2 cursor-pointer"
                >
                  <Wrench className="h-4 w-4" /> Log Work Order
                </Button>

                <Button
                  onClick={() => alert("Property edit panel is under active construction.")}
                  variant="secondary"
                  className="w-full text-[12.5px] py-2.5 gap-2 cursor-pointer"
                >
                  <PenSquare className="h-4 w-4" /> Edit Property Specs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
