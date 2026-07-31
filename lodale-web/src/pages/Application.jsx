import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "../components/Logo";
import Button from "../components/Button";
import { LISTINGS } from "../data/listings";

export default function Application() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const listing = LISTINGS.find((l) => l.id === listingId) ?? LISTINGS[0];

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
            <span className="font-semibold text-ink-900">{listing.title}</span>,{" "}
            {listing.location}.
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
            onClick={() => navigate("/dashboard/tenant")}
          >
            Submit Application
          </Button>
        </div>
      </div>
    </div>
  );
}
