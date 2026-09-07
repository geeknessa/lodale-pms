import { ADD_PROPERTY_TOUR_STEPS } from "../usePropertyFormState";

export default function TourPortal({
  runTour,
  setRunTour,
  tourStep,
  setTourStep,
  spotlightStyle,
  tooltipStyle
}) {
  if (!runTour) return null;

  return (
    <div className="tour-portal-backdrop">
      {/* Animated Glowing Spotlight Mask tracking target element in the sidebar */}
      <div className="tour-spotlight-mask" style={spotlightStyle} />

      {/* Floating Tooltip Speech Bubble positioning next to navigation item */}
      <div className="tour-tooltip-card" style={tooltipStyle}>
        <div className="tour-tooltip-header">
          <span className="tour-mascot-badge">Ayla (Lodale Guide)</span>
          <span className="tour-step-indicator">
            {tourStep + 1} / {ADD_PROPERTY_TOUR_STEPS.length}
          </span>
        </div>

        <h4 className="tour-tooltip-title">
          {ADD_PROPERTY_TOUR_STEPS[tourStep]?.title}
        </h4>
        <p className="tour-tooltip-content">
          {ADD_PROPERTY_TOUR_STEPS[tourStep]?.content}
        </p>

        <div className="tour-tooltip-actions">
          <button
            type="button"
            className="tour-btn-skip"
            onClick={() => setRunTour(false)}
          >
            Skip Tour
          </button>

          <div className="tour-nav-buttons">
            {tourStep > 0 && (
              <button
                type="button"
                className="tour-btn-back"
                onClick={() => setTourStep((prev) => prev - 1)}
              >
                Back
              </button>
            )}

            <button
              type="button"
              className="tour-btn-next"
              onClick={() => {
                if (tourStep < ADD_PROPERTY_TOUR_STEPS.length - 1) {
                  setTourStep((prev) => prev + 1);
                } else {
                  setRunTour(false);
                }
              }}
            >
              {tourStep === ADD_PROPERTY_TOUR_STEPS.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
