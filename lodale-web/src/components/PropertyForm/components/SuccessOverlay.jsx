import { useEffect, useRef } from "react";
import { CheckCircle2, SlidersHorizontal, Clock } from "lucide-react";
import gsap from "gsap";
import Button from "../../Button";

export default function SuccessOverlay({
  showSuccessOverlay,
  isSubmitted,
  isEditing,
  navigate,
  onGoToDashboard,
  successOverlayRef,
  checkIconRef,
  textContainerRef
}) {
  const isVisible = showSuccessOverlay || isSubmitted;

  const backupOverlayRef = useRef(null);
  const backupCheckRef = useRef(null);
  const backupTextRef = useRef(null);

  const activeOverlayRef = successOverlayRef || backupOverlayRef;
  const activeCheckRef = checkIconRef || backupCheckRef;
  const activeTextRef = textContainerRef || backupTextRef;

  const handleReturn = () => {
    if (typeof onGoToDashboard === "function") {
      onGoToDashboard();
    } else if (typeof navigate === "function") {
      navigate("/dashboard/landlord");
    } else {
      window.location.href = "/dashboard/landlord";
    }
  };

  useEffect(() => {
    if (isVisible && activeOverlayRef.current) {
      gsap.fromTo(activeOverlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" });

      if (activeCheckRef.current) {
        gsap.fromTo(
          activeCheckRef.current,
          { scale: 0, rotation: -45, opacity: 0 },
          { scale: 1, rotation: 0, opacity: 1, duration: 0.7, ease: "back.out(1.7)", delay: 0.3 }
        );
      }

      if (activeTextRef.current) {
        gsap.fromTo(
          activeTextRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: 0.5 }
        );
      }
    }
  }, [isVisible, activeOverlayRef, activeCheckRef, activeTextRef]);

  if (!isVisible) return null;

  return (
    <div ref={activeOverlayRef} className="dap-success-screen">
      <div className="dap-success-glow-1" />
      <div className="dap-success-inner">
        <div className="dap-success-icon-ring">
          <CheckCircle2 className="check" ref={activeCheckRef} />
          <div className="dap-success-sparkle">
            <SlidersHorizontal />
          </div>
        </div>

        <div ref={activeTextRef} className="dap-success-texts">
          <h2 className="dap-success-heading">{isEditing ? "Property Updated!" : "Property Portfolio Registered!"}</h2>
          <p className="dap-success-body">
            Your property listing and proof of ownership legal documents have been submitted to the Admin for verification and review.
          </p>

          <div className="dap-success-loader-row">
            <Clock className="animate-spin" />
            <span className="dap-success-loader-lbl">Pending Admin Verification</span>
          </div>

          <Button
            variant="primary"
            onClick={handleReturn}
            className="mt-6 w-full py-3 text-xs font-bold rounded-xl cursor-pointer"
          >
            Return to Landlord Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
