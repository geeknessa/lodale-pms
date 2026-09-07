import { ArrowLeft, ArrowRight, Lock, Loader2 } from "lucide-react";

export default function PropertyFormCapsuleNav({
  currentStep,
  handlePrevStep,
  handleNextStep,
  handleSubmit,
  isFormFullyValid = true,
  canAccessStep,
  isSubmitting = false
}) {
  const isSubmitStep = currentStep === 5;
  const isSubmitDisabled = (isSubmitStep && !isFormFullyValid) || isSubmitting;

  return (
    <div className="dap-bottom-capsule-bar">
      <button
        type="button"
        disabled={currentStep === 1 || isSubmitting}
        onClick={handlePrevStep}
        className="dap-capsule-nav-btn prev"
      >
        <ArrowLeft className="h-4 w-4" /> Previous
      </button>

      <div className="dap-capsule-step-pill">
        Step {currentStep} of 5
      </div>

      <button
        type="button"
        onClick={currentStep < 5 ? handleNextStep : handleSubmit}
        disabled={isSubmitDisabled}
        title={isSubmitDisabled ? "Please complete all required fields across all steps to unlock submission." : ""}
        className={`dap-capsule-nav-btn next ${
          isSubmitDisabled ? "opacity-50 cursor-not-allowed bg-slate-400 dark:bg-slate-700" : ""
        }`}
      >
        {currentStep < 5 ? (
          <>Next Step <ArrowRight className="h-4 w-4" /></>
        ) : isSubmitting ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting Listing...</>
        ) : isSubmitDisabled ? (
          <><Lock className="h-3.5 w-3.5" /> Complete All Steps to Submit</>
        ) : (
          "Submit Listing"
        )}
      </button>
    </div>
  );
}
