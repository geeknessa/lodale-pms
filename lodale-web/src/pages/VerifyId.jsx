import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import gsap from "gsap";
import { Logo } from "../components/Logo";
import { VerifiedBadge } from "../components/Logo";
import Button from "../components/Button";

const LOADING_MESSAGES = [
  "Connecting to NIMC identity registry portal...",
  "Validating 11-digit NIN security payload...",
  "Synchronizing digital identity trace profile...",
];

export default function VerifyId() {
  const { state } = useLocation();
  const role = state?.role ?? "tenant";
  const skipWelcome = state?.skipWelcome ?? false;
  const listingId = state?.listingId;
  const username = state?.username ?? "";
  const navigate = useNavigate();

  const [verified, setVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [nin, setNin] = useState("");
  const successContainerRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    // Mount entry animation for the main verification card
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    }
  }, []);

  useEffect(() => {
    if (verified && successContainerRef.current) {
      gsap.fromTo(
        successContainerRef.current.children,
        { opacity: 0, scale: 0.96, y: 15 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.12,
          ease: "power2.out"
        }
      );
    }
  }, [verified]);

  function handleVerify(e) {
    e.preventDefault();
    setIsVerifying(true);
    setProgress(0);
    setLoadingStep(0);

    const targetObj = { val: 0 };
    gsap.to(targetObj, {
      val: 100,
      duration: 2.8,
      ease: "power1.inOut",
      onUpdate: () => {
        const currentProgress = Math.round(targetObj.val);
        setProgress(currentProgress);

        if (currentProgress > 72) {
          setLoadingStep(2);
        } else if (currentProgress > 36) {
          setLoadingStep(1);
        } else {
          setLoadingStep(0);
        }
      },
      onComplete: () => {
        setIsVerifying(false);
        setVerified(true);
      },
    });
  }

  function handleContinue() {
    if (skipWelcome && listingId) {
      navigate(`/apply/${listingId}`);
    } else {
      navigate(`/welcome/${role}`, { state: { username } });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-bg-offset px-6 py-16">
      <div className="w-full max-w-lg">
        <Logo className="mb-10 justify-center" />

        <div ref={cardRef} className="rounded-2xl border border-theme-border bg-theme-card-bg p-8 shadow-sm">
          <span className="text-[11px] font-semibold tracking-wide text-ink-400">
            STEP 3 OF 3
          </span>

          <div className="mt-2 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-moss-600" />
            <h1 className="font-display text-2xl font-semibold text-ink-900">
              Verify your identity (NIN)
            </h1>
          </div>

          <p className="mt-3 text-[14px] text-ink-700 leading-relaxed">
            We check your National Identification Number automatically in the
            background — it just confirms you&rsquo;re a real, traceable person.
            Required for both landlords and tenants.
          </p>

          {isVerifying ? (
            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center text-[13px] font-medium text-ink-700">
                <span className="animate-pulse">
                  {LOADING_MESSAGES[loadingStep]}
                </span>
                <span className="font-bold text-moss-700">{progress}%</span>
              </div>
              <div className="w-full bg-ink-200 h-2 rounded-full overflow-hidden relative">
                <div
                  className="bg-moss-700 h-full rounded-full transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : !verified ? (
            <form onSubmit={handleVerify} className="mt-6 space-y-4">
              <input
                value={nin}
                onChange={(e) => setNin(e.target.value)}
                maxLength={11}
                placeholder="Enter your 11-digit NIN"
                className="w-full rounded-lg border border-theme-border bg-theme-card-bg px-4 py-3 text-[15px] outline-none hover:border-moss-500/50 dark:hover:border-white/20 focus:border-moss-600 focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 dark:focus-visible:ring-white transition-all duration-200"
                required
                aria-label="NIN input field"
              />
              <Button
                type="submit"
                className="w-full focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none"
              >
                Verify Now
              </Button>
            </form>
          ) : (
            <div ref={successContainerRef} className="mt-6 space-y-6">
              <div className="rounded-xl border border-theme-border p-5">
                <span className="text-[11px] font-medium text-ink-400">
                  PREVIEW
                </span>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-ink-200" />
                  <div>
                    <div className="font-medium text-ink-900">
                      {username || "Your Name"}
                    </div>
                    <VerifiedBadge className="mt-1" />
                  </div>
                </div>
                <p className="mt-3 text-[13px] text-ink-700 leading-relaxed">
                  New to Lodale — no rental history yet, ID verified.
                </p>
              </div>
              <Button
                className="w-full focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none"
                onClick={handleContinue}
              >
                Continue
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
