import { useState } from "react";
import { 
  X, Mail, Phone, Briefcase, Wallet, Star, CheckCircle2, 
  Clock, CheckCircle, Award, ThumbsUp, ThumbsDown, Calendar
} from "lucide-react";

// Deterministic helper to get detailed reliability score breakdown based on score & tenant name
const getReliabilityDetails = (name = "", scoreVal = "4.7") => {
  const score = parseFloat(scoreVal) || 4.7;
  
  // Specific mock data for seeded default tenants
  if (name.includes("Maren Maureen")) {
    return {
      score: 4.9,
      paymentHistory: {
        summary: "12 of 12 payments on-time (100%)",
        status: "Excellent",
        history: [
          { month: "Jan 2026", status: "On-Time", details: "Paid 1 day early" },
          { month: "Dec 2025", status: "On-Time", details: "Paid on due date" },
          { month: "Nov 2025", status: "On-Time", details: "Paid on due date" },
          { month: "Oct 2025", status: "On-Time", details: "Paid 3 days early (auto-pay)" },
          { month: "Sep 2025", status: "On-Time", details: "Paid 1 day early" },
          { month: "Aug 2025", status: "On-Time", details: "Paid on due date" },
        ]
      },
      propertyCondition: {
        status: "Excellent",
        notes: "Property returned in immaculate condition. Carpets were professionally cleaned, walls undamaged, all keys and access cards returned on schedule."
      },
      reviews: [
        {
          landlord: "Chief Alabi (VGC Landlord)",
          rating: 5.0,
          text: "Maren is a dream tenant. Quiet, extremely respectful, and paid rent on time every single month. She took care of the flat like it was her own. I would rent to her again in a heartbeat.",
          rentAgain: "Yes"
        }
      ],
      rentAgain: "Yes"
    };
  }
  
  if (name.includes("Ryan Herwinds")) {
    return {
      score: 4.8,
      paymentHistory: {
        summary: "11 of 12 payments on-time (91.6%)",
        status: "Very Good",
        history: [
          { month: "Jan 2026", status: "On-Time", details: "Paid on due date" },
          { month: "Dec 2025", status: "On-Time", details: "Paid 1 day early" },
          { month: "Nov 2025", status: "On-Time", details: "Paid on due date" },
          { month: "Oct 2025", status: "Late", details: "Late by 2 days (forgot due to travel, paid immediately upon notification)" },
          { month: "Sep 2025", status: "On-Time", details: "Paid on due date" },
          { month: "Aug 2025", status: "On-Time", details: "Paid 2 days early" },
        ]
      },
      propertyCondition: {
        status: "Very Good",
        notes: "Minor scuff marks on dining area wall, but overall very neat and clean. Left the apartment in excellent shape with no damage."
      },
      reviews: [
        {
          landlord: "Mrs. Ngozi Johnson (Lekki Host)",
          rating: 4.8,
          text: "Ryan lived in my unit for two years. He is a very neat and communicative tenant. There was one minor delay with rent due to travel, but he sorted it out immediately with sincere apologies.",
          rentAgain: "Yes"
        }
      ],
      rentAgain: "Yes"
    };
  }

  if (name.includes("Emeka Obi")) {
    return {
      score: 4.6,
      paymentHistory: {
        summary: "10 of 12 payments on-time (83.3%)",
        status: "Good",
        history: [
          { month: "Jan 2026", status: "On-Time", details: "Paid on due date" },
          { month: "Dec 2025", status: "Late", details: "Late by 4 days (bank network issue during holiday season)" },
          { month: "Nov 2025", status: "On-Time", details: "Paid on due date" },
          { month: "Oct 2025", status: "On-Time", details: "Paid on due date" },
          { month: "Sep 2025", status: "Late", details: "Late by 3 days (salary disbursement delay)" },
          { month: "Aug 2025", status: "On-Time", details: "Paid on due date" },
        ]
      },
      propertyCondition: {
        status: "Good",
        notes: "Requires deep cleaning of the kitchen/bathroom, but no structural alterations or physical damage. All fixtures left fully intact."
      },
      reviews: [
        {
          landlord: "Mr. Tunde Bakare (Ikeja Landlord)",
          rating: 4.5,
          text: "Emeka is a decent tenant. Quiet and polite to neighbors. Rent was late twice due to bank and salary delays, but he always communicated in advance so we were aligned.",
          rentAgain: "Yes"
        }
      ],
      rentAgain: "Yes"
    };
  }

  // Fallback dynamic generator for new/other tenants based on their score
  const isExcellent = score >= 4.8;
  const isGood = score >= 4.5;
  const onTimeCount = isExcellent ? 12 : isGood ? 11 : 10;
  const rentAgainChoice = score >= 4.4 ? "Yes" : "No";
  
  return {
    score: score,
    paymentHistory: {
      summary: `${onTimeCount} of 12 payments on-time (${Math.round((onTimeCount/12)*100)}%)`,
      status: isExcellent ? "Excellent" : isGood ? "Very Good" : "Satisfactory",
      history: [
        { month: "Recent Month 1", status: "On-Time", details: "Paid early" },
        { month: "Recent Month 2", status: "On-Time", details: "Paid on due date" },
        { month: "Recent Month 3", status: isExcellent ? "On-Time" : "Late", details: isExcellent ? "Paid on due date" : "Late by 3 days" },
        { month: "Recent Month 4", status: "On-Time", details: "Paid on due date" },
        { month: "Recent Month 5", status: "On-Time", details: "Paid early" },
        { month: "Recent Month 6", status: "On-Time", details: "Paid on due date" },
      ]
    },
    propertyCondition: {
      status: isExcellent ? "Excellent" : isGood ? "Very Good" : "Fair",
      notes: isExcellent 
        ? "No damage recorded. Property returned in immaculate clean state, completely swept and wiped." 
        : isGood 
        ? "No major damages. Normal wear and tear on walls, left unit swept." 
        : "Minor repairs needed (cabinet hinge loose, deep cleaning of refrigerator and carpets required)."
    },
    reviews: [
      {
        landlord: "Past Verified Landlord",
        rating: score,
        text: isExcellent 
          ? `${name} was a superb tenant. Respectful, clean, and extremely reliable with payments. Highly recommend.` 
          : isGood 
          ? `${name} maintained the property well and was easy to communicate with. Rent was mostly on time.`
          : `${name} was cooperative overall. Paid rent after a few reminders, but was polite.`,
        rentAgain: rentAgainChoice
      }
    ],
    rentAgain: rentAgainChoice
  };
};

export default function UserInfo({ tenant, onClose }) {
  const [showReliabilityDetails, setShowReliabilityDetails] = useState(false);
  
  if (!tenant) return null;

  const scoreDetails = getReliabilityDetails(tenant.name || tenant.tenantName, tenant.reliabilityScore);
  
  if (tenant.customReviews && Array.isArray(tenant.customReviews)) {
    scoreDetails.reviews = [...tenant.customReviews, ...scoreDetails.reviews];
  }

  return (
    <div className="ui-modal-overlay" onClick={onClose}>
      <div className="ui-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="ui-modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X className="h-5 w-5" />
        </button>

        {/* Profile Header */}
        <div className="ui-profile-header">
          <div className="ui-avatar-wrapper">
            <img src={tenant.avatar} alt={tenant.name} className="ui-profile-avatar" />
            <span className="ui-verified-badge" title="Verified NIN">
              <CheckCircle2 className="h-4 w-4 fill-white text-[#2C4633]" />
            </span>
          </div>
          <div className="ui-profile-title">
            <h2>{tenant.name || tenant.tenantName}</h2>
            <div className="ui-meta-row">
              <span className="ui-status-pill">{tenant.leaseStatus || tenant.status || "Applicant"}</span>
              <button 
                className="ui-score-btn"
                onClick={() => setShowReliabilityDetails(true)}
                title="Click to view detailed reliability history breakdown"
              >
                <Star className="h-3.5 w-3.5 fill-[#D69E2E] text-[#D69E2E]" />
                <span className="score-text">
                  <strong>{tenant.reliabilityScore || "4.7"}</strong> Reliability Score
                </span>
                <span className="ui-score-details-link">View Details →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Content Grid */}
        <div className="ui-profile-content">
          <div className="ui-info-section">
            <h3 className="ui-section-title">Contact & Professional Details</h3>
            <div className="ui-details-grid">
              <div className="ui-detail-item">
                <div className="ui-detail-icon">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div className="ui-detail-text">
                  <span className="ui-detail-label">Email Address</span>
                  <span className="ui-detail-value">{tenant.email}</span>
                </div>
              </div>

              <div className="ui-detail-item">
                <div className="ui-detail-icon">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <div className="ui-detail-text">
                  <span className="ui-detail-label">Phone Number</span>
                  <span className="ui-detail-value">{tenant.phone}</span>
                </div>
              </div>

              <div className="ui-detail-item">
                <div className="ui-detail-icon">
                  <Briefcase className="h-4.5 w-4.5" />
                </div>
                <div className="ui-detail-text">
                  <span className="ui-detail-label">Occupation</span>
                  <span className="ui-detail-value">{tenant.occupation}</span>
                </div>
              </div>

              <div className="ui-detail-item">
                <div className="ui-detail-icon">
                  <Wallet className="h-4.5 w-4.5" />
                </div>
                <div className="ui-detail-text">
                  <span className="ui-detail-label">Monthly Income</span>
                  <span className="ui-detail-value">{tenant.income}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Background Check & History Notes */}
          <div className="ui-notes-section">
            <h3 className="ui-section-title">Reliability Check & Verification Notes</h3>
            <div className="ui-notes-box">
              <p className="ui-notes-content">{tenant.notes}</p>
              <div className="ui-verification-checklist">
                <div className="ui-checklist-item">
                  <span className="ui-check-icon">✓</span>
                  <span>NIN Verification Match</span>
                </div>
                <div className="ui-checklist-item">
                  <span className="ui-check-icon">✓</span>
                  <span>Credit Reference Check Passed</span>
                </div>
                <div className="ui-checklist-item">
                  <span className="ui-check-icon">✓</span>
                  <span>Previous Landlord Review Cleared</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="ui-modal-footer">
          <button className="ui-footer-close-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>

      {/* Reliability Breakdown Sub-Modal */}
      {showReliabilityDetails && (
        <div className="reliability-details-overlay" onClick={() => setShowReliabilityDetails(false)}>
          <div className="reliability-details-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="reliability-modal-header">
              <h3>Reliability Breakdown</h3>
              <button 
                className="reliability-modal-close" 
                onClick={() => setShowReliabilityDetails(false)}
                aria-label="Close breakdown"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Score Banner */}
            <div className="reliability-score-banner">
              <div className="reliability-score-value">
                <Star className="h-8 w-8 fill-[#D69E2E] text-[#D69E2E]" />
                <span className="score-num">{scoreDetails.score.toFixed(1)}</span>
                <span className="score-max">/ 5.0</span>
              </div>
              <p className="reliability-score-desc">
                Verified rating computed from rental history, timely payments, and landlord evaluations.
              </p>
            </div>

            {/* Scrollable Breakdown Sections */}
            <div className="reliability-scroll-content">
              {/* Payment History */}
              <div className="reliability-card-section">
                <div className="reliability-card-section-title">
                  <Clock className="h-4.5 w-4.5 text-[#2C4633] mr-2" />
                  <h4>Payment History</h4>
                </div>
                <div className="reliability-card-content">
                  <div className="reliability-ratio-row">
                    <span className="ratio-label">On-Time Payments:</span>
                    <span className={`ratio-value status-${scoreDetails.paymentHistory.status.toLowerCase().replace(" ", "-")}`}>
                      {scoreDetails.paymentHistory.summary}
                    </span>
                  </div>
                  <div className="payment-history-timeline">
                    {scoreDetails.paymentHistory.history.map((item, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-marker-col">
                          <span className={`timeline-dot ${item.status.toLowerCase()}`}></span>
                          {idx !== scoreDetails.paymentHistory.history.length - 1 && <span className="timeline-line"></span>}
                        </div>
                        <div className="timeline-details-col">
                          <div className="timeline-time-row">
                            <span className="timeline-month">{item.month}</span>
                            <span className={`timeline-badge ${item.status.toLowerCase()}`}>
                              {item.status}
                            </span>
                          </div>
                          <span className="timeline-desc">{item.details}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Property Condition at Move-Out */}
              <div className="reliability-card-section">
                <div className="reliability-card-section-title">
                  <CheckCircle className="h-4.5 w-4.5 text-[#2C4633] mr-2" />
                  <h4>Property Condition at Move-Out</h4>
                </div>
                <div className="reliability-card-content">
                  <div className="condition-status-row">
                    <span className="condition-label">Move-Out Condition:</span>
                    <span className={`condition-value-badge ${scoreDetails.propertyCondition.status.toLowerCase()}`}>
                      {scoreDetails.propertyCondition.status}
                    </span>
                  </div>
                  <blockquote className="condition-notes-quote">
                    "{scoreDetails.propertyCondition.notes}"
                  </blockquote>
                </div>
              </div>

              {/* Written Landlord Reviews & Rent Again */}
              <div className="reliability-card-section">
                <div className="reliability-card-section-title">
                  <Award className="h-4.5 w-4.5 text-[#2C4633] mr-2" />
                  <h4>Past Landlord Testimony</h4>
                </div>
                <div className="reliability-card-content">
                  {scoreDetails.reviews.map((rev, idx) => (
                    <div key={idx} className="landlord-review-block">
                      <div className="landlord-review-header">
                        <span className="landlord-reviewer-name">{rev.landlord}</span>
                        <div className="landlord-reviewer-rating">
                          <Star className="h-3.5 w-3.5 fill-[#D69E2E] text-[#D69E2E] mr-1" />
                          <span>{rev.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="landlord-review-body">"{rev.text}"</p>
                      
                      <div className="landlord-rent-again-box">
                        <span className="rent-again-q">Would rent to them again?</span>
                        <span className={`rent-again-ans ${rev.rentAgain.toLowerCase()}`}>
                          {rev.rentAgain === "Yes" ? (
                            <>
                              <ThumbsUp className="h-3.5 w-3.5" /> Yes, absolutely
                            </>
                          ) : (
                            <>
                              <ThumbsDown className="h-3.5 w-3.5" /> No
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="reliability-modal-footer-bar">
              <button 
                className="reliability-close-btn" 
                onClick={() => setShowReliabilityDetails(false)}
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
