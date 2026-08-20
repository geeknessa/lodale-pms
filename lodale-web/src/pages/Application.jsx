import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Logo } from "../components/Logo";
import Button from "../components/Button";
import { propertyService } from "../services/propertyService";
import { applicationService } from "../services/applicationService";
import { triggerToast } from "../context/ToastContext";

export default function Application() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [appStatus, setAppStatus] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [data, existingApp] = await Promise.all([
          propertyService.getPropertyById(listingId),
          applicationService.getApplicationForProperty(listingId),
        ]);
        setListing(data);
        if (existingApp) {
          setHasApplied(true);
          setAppStatus(existingApp.status || "Pending");
        }
      } catch (err) {
        console.warn("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    if (listingId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [listingId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await applicationService.apply(listingId, "Application submitted via portal.");
      triggerToast("Application submitted successfully! The landlord will review your profile.", "success", "Application Sent");
      navigate("/dashboard/tenant?tab=4");
    } catch (err) {
      const message = err.message || "Failed to submit application.";
      if (message.toLowerCase().includes("already")) {
        triggerToast("You have already applied for this property.", "info", "Already Applied");
        setHasApplied(true);
      } else {
        triggerToast(message, "error", "Application Error");
      }
    } finally {
      setSubmitting(false);
    }
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

          {hasApplied ? (
            <div className="mt-6 rounded-xl bg-moss-50 border border-moss-200 p-4 text-center text-[13px] text-moss-800 font-medium">
              You have already applied for this property.<br />
              Status: <span className="font-bold capitalize">{appStatus}</span>
            </div>
          ) : (
            <>
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
                className="mt-6 w-full flex items-center justify-center gap-2"
                onClick={handleSubmit}
                disabled={loading || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : "Submit Application"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

