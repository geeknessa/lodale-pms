import { useState } from "react";
import { Star, X, CheckCircle2, UserCheck, UserX, Loader2 } from "lucide-react";
import Button from "./Button";
import { ratingService } from "../services/ratingService";
import { triggerToast } from "../context/ToastContext";

export default function RateLandlordModal({
  isOpen,
  onClose,
  landlordId,
  landlordName = "Landlord",
  tenantId,
  tenantName = "Tenant",
  propertyTitle = "",
  onSuccess
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);

    try {
      const res = ratingService.submitLandlordReview({
        landlordId,
        landlordName,
        tenantId,
        tenantName,
        rating,
        comment,
        wouldRecommend,
        propertyTitle
      });

      if (res.success) {
        triggerToast("Thank you! Your landlord rating has been submitted successfully.", "success", "Rating Saved");
        if (onSuccess) onSuccess(res.review);
        onClose();
      } else {
        triggerToast(res.message || "Failed to save rating.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("An error occurred while submitting rating.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#07130D] rounded-2xl shadow-2xl w-full max-w-md p-6 border border-ink-200 dark:border-white/10 text-left space-y-5" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-ink-100 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-ink-900 dark:text-white flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> Rate Your Landlord
            </h3>
            <p className="text-xs text-ink-500 dark:text-cream-100/60 mt-0.5">
              {landlordName} {propertyTitle ? `• ${propertyTitle}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-ink-400 hover:text-ink-900 dark:text-cream-100/50 dark:hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Star Rating */}
          <div className="text-center space-y-2">
            <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 uppercase tracking-wider">
              Overall Landlord Rating
            </label>
            <div className="flex justify-center items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const activeStar = hoverRating ? star <= hoverRating : star <= rating;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1.5 transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${activeStar ? 'fill-amber-400 text-amber-400' : 'text-ink-200 dark:text-white/20'}`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-semibold text-moss-700 dark:text-[#E5C583]">
              {rating === 5 ? '5.0 - Excellent Landlord' : rating === 4 ? '4.0 - Good Experience' : rating === 3 ? '3.0 - Average' : rating === 2 ? '2.0 - Below Expectations' : '1.0 - Poor'}
            </span>
          </div>

          {/* Comment */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-ink-800 dark:text-cream-100">
              Review Comment (Optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about responsiveness to repair requests, communication, fairness, and property care..."
              className="w-full rounded-xl border border-ink-200 dark:border-white/10 p-3 text-xs text-ink-900 dark:text-white bg-cream-50/50 dark:bg-white/5 outline-none focus:border-moss-600 transition-colors"
            />
          </div>

          {/* Would Recommend */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink-800 dark:text-cream-100">
              Would you recommend this landlord to other tenants?
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWouldRecommend(true)}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${wouldRecommend
                  ? 'bg-moss-600 text-white border-moss-600 dark:bg-[#E5C583] dark:text-[#09090b] dark:border-[#E5C583]'
                  : 'bg-white dark:bg-white/5 text-ink-700 dark:text-cream-100 border-ink-200 dark:border-white/10'
                  }`}
              >
                <UserCheck className="h-4 w-4" /> Yes, Highly
              </button>
              <button
                type="button"
                onClick={() => setWouldRecommend(false)}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${!wouldRecommend
                  ? 'bg-rose-600 text-white border-rose-600 dark:bg-rose-500 dark:text-white dark:border-rose-500'
                  : 'bg-white dark:bg-white/5 text-ink-700 dark:text-cream-100 border-ink-200 dark:border-white/10'
                  }`}
              >
                <UserX className="h-4 w-4" /> No
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-moss-600 hover:bg-moss-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving Review...
              </span>
            ) : (
              "Submit Landlord Review"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
