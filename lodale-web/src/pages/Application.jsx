import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "../components/Logo";
import Button from "../components/Button";
import { propertyService } from "../services/propertyService";

export default function Application() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadListing() {
      setLoading(true);
      try {
        const data = await propertyService.getPropertyById(listingId);
        setListing(data);
      } catch (err) {
        console.warn("Failed to load property:", err);
      } finally {
        setLoading(false);
      }
    }
    if (listingId) {
      loadListing();
    } else {
      setLoading(false);
    }
  }, [listingId]);

  const handleSubmit = () => {
    const username = sessionStorage.getItem("username") || "Tenant User";
    const userEmail = sessionStorage.getItem("lastLoggedInEmail") || "tenant@example.com";
    const saved = localStorage.getItem("propertyApplications");
    const currentApps = saved ? JSON.parse(saved) : [];
    
    const newApp = {
      id: Date.now(),
      tenantName: username,
      name: username,
      email: userEmail,
      propertyId: listing?.id || listingId,
      propertyTitle: listing?.title || "Rental Property",
      date: "Just now",
      status: "Applicant",
      reliabilityScore: "5.0",
      notes: "Verified NIN application submitted via portal."
    };

    localStorage.setItem("propertyApplications", JSON.stringify([newApp, ...currentApps]));
    window.dispatchEvent(new Event("storage"));
    navigate("/dashboard/tenant");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-6 py-16">
      <div className="w-full max-w-lg text-center">
        <Logo className="mb-10 justify-center" />

        <div className="rounded-2xl border border-ink-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-moss-100 text-moss-700">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">
            You&rsquo;re verified — let&rsquo;s apply
          </h1>
          <p className="mt-2 text-[14px] text-ink-700">
            Applying for{" "}
            <span className="font-semibold text-ink-900">
              {loading ? "Loading property..." : (listing?.title || "Property Listing")}
            </span>
            {listing?.location ? `, ${listing.location}` : (listing?.city ? `, ${listing.city}` : "")}.
          </p>

          <div className="mt-6 rounded-xl bg-cream-50 p-4 text-left text-[13px] text-ink-700">
            <p>Your application will include:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>Your verified profile (ID confirmed with NIN)</li>
              <li>
                Your Tenant Reliability Score, once you have rental history
              </li>
              <li>
                Any documents the landlord asks for (employment proof,
                guarantor, etc.)
              </li>
            </ul>
          </div>

          <Button
            className="mt-6 w-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            Submit Application
          </Button>
        </div>
      </div>
    </div>
  );
}
