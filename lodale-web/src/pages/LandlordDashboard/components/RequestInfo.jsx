import { X, Calendar, ClipboardList, PenTool, CheckCircle, Clock } from "lucide-react";
import Avatar from "../../../components/Avatar";

export default function RequestInfo({ request, onClose, onUpdateStatus }) {
  if (!request) return null;

  return (
    <div className="ui-modal-overlay" onClick={onClose}>
      <div className="ui-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="ui-modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="ui-profile-header">
          <div className="ui-detail-icon" style={{ width: "48px", height: "48px", borderRadius: "12px" }}>
            <ClipboardList className="h-6 w-6 text-[#2C4633]" />
          </div>
          <div className="ui-profile-title">
            <h2 style={{ fontSize: "19px" }}>Maintenance Request Details</h2>
            <div className="ui-meta-row">
              <span className={`request-status-badge ${request.status.toLowerCase().replace(" ", "-")}`}>
                {request.status}
              </span>
              <span className="ui-score-pill" style={{ fontSize: "12px" }}>
                <Calendar className="h-3.5 w-3.5 mr-1" />
                {request.date}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="ui-profile-content">
          {/* Tenant Details */}
          <div className="ui-info-section">
            <h3 className="ui-section-title">Submitted By</h3>
            <div className="ui-detail-item" style={{ padding: "12px", gap: "14px" }}>
              <Avatar src={request.avatar} name={request.tenantName} className="ui-profile-avatar rounded-full" style={{ width: "44px", height: "44px" }} />
              <div className="ui-detail-text">
                <span className="ui-detail-value" style={{ fontSize: "14px" }}>{request.tenantName}</span>
                <span className="ui-detail-label">{request.leaseStatus || "Active Tenant"}</span>
              </div>
            </div>
          </div>

          {/* Request details info */}
          <div className="ui-info-section">
            <h3 className="ui-section-title">Request Specifications</h3>
            <div className="ui-details-grid" style={{ gridTemplateColumns: "1fr" }}>
              <div className="ui-detail-item" style={{ alignItems: "flex-start" }}>
                <div className="ui-detail-icon">
                  <PenTool className="h-4.5 w-4.5" />
                </div>
                <div className="ui-detail-text" style={{ flexGrow: 1 }}>
                  <span className="ui-detail-label">Request Type</span>
                  <span className="ui-detail-value">{request.type}</span>
                </div>
              </div>

              <div className="ui-detail-item" style={{ alignItems: "flex-start", flexDirection: "column", gap: "6px" }}>
                <span className="ui-detail-label">Description of Request</span>
                <p className="ui-notes-content" style={{ margin: 0, fontSize: "13px" }}>
                  {request.details}
                </p>
              </div>
            </div>
          </div>

          {/* Actions to Update Status */}
          <div className="ui-notes-section">
            <h3 className="ui-section-title">Update Status</h3>
            <div className="ui-notes-box" style={{ display: "flex", gap: "10px", padding: "16px" }}>
              <button
                className="db-action-btn"
                style={{ backgroundColor: "rgba(229, 197, 131, 0.15)", color: "#C69024", flexGrow: 1, padding: "10px" }}
                onClick={() => {
                  onUpdateStatus(request.id, "Pending");
                  onClose();
                }}
              >
                Set Pending
              </button>
              <button
                className="db-action-btn"
                style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", color: "#2563EB", flexGrow: 1, padding: "10px" }}
                onClick={() => {
                  onUpdateStatus(request.id, "In Progress");
                  onClose();
                }}
              >
                Set In Progress
              </button>
              <button
                className="db-action-btn"
                style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10B981", flexGrow: 1, padding: "10px" }}
                onClick={() => {
                  onUpdateStatus(request.id, "Completed");
                  onClose();
                }}
              >
                Set Completed
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ui-modal-footer" style={{ marginTop: "24px" }}>
          <button className="ui-footer-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
