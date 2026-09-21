import { useState } from "react";
import { 
  X, MessageSquare, FileText
} from "lucide-react";
import Avatar from "../../../components/Avatar";

export default function TenantDetails({ tenant, onClose, onChatClick }) {
  if (!tenant) return null;

  const tenantName = tenant.name || tenant.tenantName || `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || (tenant.tenant ? `${tenant.tenant.first_name || tenant.tenant.firstName || ''} ${tenant.tenant.last_name || tenant.tenant.lastName || ''}`.trim() : '') || "Tenant";
  
  const contactNo = tenant.phone || tenant.contactNo || tenant.tenant_phone || (tenant.tenant && tenant.tenant.phone) || "Not Provided";
  const emailId = tenant.email || tenant.tenant_email || (tenant.tenant && tenant.tenant.email) || "Not Provided";
  const emergencyNo = tenant.emergencyContact || tenant.guarantorPhone || "Not Provided";
  const currentAddress = tenant.currentAddress || tenant.address || "Not Provided";
  const occupation = tenant.occupation || tenant.employmentStatus || "Not Provided";
  const guarantorName = tenant.guarantorName || "Not Provided";
  const guarantorContact = tenant.guarantorPhone || "Not Provided";
  
  const rentAmount = tenant.rentAmount || tenant.propertyRentAmount || 0;
  const formattedRent = rentAmount > 0 ? `₦${parseFloat(rentAmount).toLocaleString()}` : "Not Specified";
  const rentPeriod = tenant.rentPeriod || "monthly";
  const paymentStatus = (tenant.paymentStatus || "unpaid").toLowerCase();
  
  const startDate = tenant.startDate ? new Date(tenant.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : "Not Provided";
  const endDate = tenant.endDate ? new Date(tenant.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : "Not Provided";

  const documents = Array.isArray(tenant.documents) ? tenant.documents : [];
  const leaseDoc = documents.find(d => d.type?.toLowerCase().includes("lease")) || documents[0];

  const maintenanceRequests = Array.isArray(tenant.maintenanceRequests) ? tenant.maintenanceRequests : [];
  const paymentHistory = Array.isArray(tenant.paymentHistory) ? tenant.paymentHistory : [];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-6xl bg-[#FAFAFA] dark:bg-[#07130D] rounded-3xl shadow-2xl border border-ink-100 dark:border-white/10 max-h-[92vh] overflow-y-auto relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER SECTION */}
        <div className="p-6 md:p-8 bg-white dark:bg-white/5 border-b border-ink-100 dark:border-white/10 sticky top-0 z-10 flex items-center justify-between">
           <div>
              <h2 className="text-xl md:text-2xl font-black text-ink-900 dark:text-white mb-6">Tenant Details</h2>
              <div className="flex items-center gap-4">
                 <div className="relative">
                    <Avatar src={tenant.avatar} name={tenantName} className="w-16 h-16 rounded-full border-2 border-white dark:border-white/10 shadow-sm object-cover" />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-white/10 rounded-full"></span>
                 </div>
                 <h3 className="text-lg font-bold text-ink-900 dark:text-white">{tenantName}</h3>
              </div>
           </div>
           
           <div className="flex flex-col items-end">
              <button onClick={onClose} className="p-2 mb-6 rounded-full hover:bg-ink-100 dark:hover:bg-white/10 transition-colors text-ink-400 dark:text-white/60">
                 <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                 <span className="text-sm font-semibold text-ink-500 dark:text-white/60">Rent Details :</span>
                 <span className="text-2xl font-black text-ink-900 dark:text-white">{formattedRent}/{rentPeriod.replace(/ly$/, '')}</span>
                 {paymentStatus === "paid" ? (
                   <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded">Paid</span>
                 ) : (
                   <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 rounded capitalize">{paymentStatus}</span>
                 )}
              </div>
           </div>
        </div>

        {/* MAIN 2-COLUMN GRID */}
        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
           
           {/* LEFT COLUMN: DETAILS */}
           <div className="space-y-8">
              
              {/* Personal Details */}
              <section>
                 <h4 className="text-[15px] font-bold text-ink-900 dark:text-white mb-4">Personal Details</h4>
                 <div className="bg-white dark:bg-white/5 border border-ink-100 dark:border-white/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                    <div>
                       <div className="text-xs font-semibold text-ink-400 dark:text-white/50 mb-1.5">Contact No. :</div>
                       <div className="text-sm font-bold text-ink-900 dark:text-white">{contactNo}</div>
                    </div>
                    <div>
                       <div className="text-xs font-semibold text-ink-400 dark:text-white/50 mb-1.5">Emergency No. :</div>
                       <div className="text-sm font-bold text-ink-900 dark:text-white">{emergencyNo}</div>
                    </div>
                    <div>
                       <div className="text-xs font-semibold text-ink-400 dark:text-white/50 mb-1.5">Email Id :</div>
                       <div className="text-sm font-bold text-ink-900 dark:text-white break-all">{emailId}</div>
                    </div>
                    <div>
                       <div className="text-xs font-semibold text-ink-400 dark:text-white/50 mb-1.5">Current Address :</div>
                       <div className="text-sm font-bold text-ink-900 dark:text-white leading-tight">{currentAddress}</div>
                    </div>
                    <div>
                       <div className="text-xs font-semibold text-ink-400 dark:text-white/50 mb-1.5">Occupation :</div>
                       <div className="text-sm font-bold text-ink-900 dark:text-white">{occupation}</div>
                    </div>
                 </div>
              </section>

              {/* Lease Agreement */}
              <section>
                 <h4 className="text-[15px] font-bold text-ink-900 dark:text-white mb-4">Lease Agreement</h4>
                 <div className="bg-white dark:bg-white/5 border border-ink-100 dark:border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-6">
                       <div className="flex gap-4">
                         <div className="text-xs font-semibold text-ink-400 dark:text-white/50 w-24 shrink-0">Start Date :</div>
                         <div className="text-sm font-bold text-ink-900 dark:text-white">{startDate}</div>
                       </div>
                       <div className="flex gap-4">
                         <div className="text-xs font-semibold text-ink-400 dark:text-white/50 w-24 shrink-0">End Date :</div>
                         <div className="text-sm font-bold text-ink-900 dark:text-white">{endDate}</div>
                       </div>
                       <div className="flex gap-4">
                         <div className="text-xs font-semibold text-ink-400 dark:text-white/50 w-24 shrink-0">Payment terms :</div>
                         <div className="text-sm font-bold text-ink-900 dark:text-white capitalize">{rentPeriod}</div>
                       </div>
                    </div>
                    
                    <div className="flex-1">
                       <div className="text-xs font-semibold text-ink-400 dark:text-white/50 mb-2">Lease document :</div>
                       {leaseDoc ? (
                         <div className="border border-ink-100 dark:border-white/10 rounded-xl p-3 flex items-start gap-3 bg-[#FAFAFA] dark:bg-white/5 cursor-pointer hover:bg-ink-50 dark:hover:bg-white/10 transition-colors">
                           <FileText className="w-6 h-6 text-rose-500" />
                           <div>
                             <div className="text-xs font-bold text-ink-900 dark:text-white line-clamp-1">{leaseDoc.name || "Lease_Document.pdf"}</div>
                             <div className="text-[10px] text-ink-400 dark:text-white/50 font-semibold">{leaseDoc.size || "Unknown Size"}</div>
                           </div>
                         </div>
                       ) : (
                         <div className="text-sm font-bold text-ink-400 dark:text-white/50 mt-4">Not uploaded</div>
                       )}
                    </div>
                 </div>
              </section>

              {/* Additional Details */}
              <section>
                 <h4 className="text-[15px] font-bold text-ink-900 dark:text-white mb-4">Additional Details</h4>
                 <div className="bg-white dark:bg-white/5 border border-ink-100 dark:border-white/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                    <div>
                       <div className="text-xs font-semibold text-ink-400 dark:text-white/50 mb-1.5">Guarantor Name :</div>
                       <div className="text-sm font-bold text-ink-900 dark:text-white">{guarantorName}</div>
                    </div>
                    <div>
                       <div className="text-xs font-semibold text-ink-400 dark:text-white/50 mb-1.5">Contact No. :</div>
                       <div className="text-sm font-bold text-ink-900 dark:text-white">{guarantorContact}</div>
                    </div>
                    <div>
                       <div className="text-xs font-semibold text-ink-400 dark:text-white/50 mb-1.5">Allotted Parking :</div>
                       <div className="text-sm font-bold text-ink-900 dark:text-white">{tenant.parking || "-"}</div>
                    </div>
                    <div>
                       <div className="text-xs font-semibold text-ink-400 dark:text-white/50 mb-1.5">Access Card No. :</div>
                       <div className="text-sm font-bold text-ink-900 dark:text-white">{tenant.accessCard || "-"}</div>
                    </div>
                    <div>
                       <div className="text-xs font-semibold text-ink-400 dark:text-white/50 mb-1.5">Occupation :</div>
                       <div className="text-sm font-bold text-ink-900 dark:text-white">{occupation}</div>
                    </div>
                 </div>
              </section>
           </div>

           {/* RIGHT COLUMN: TABLES */}
           <div className="space-y-8">
              
              {/* Maintenance Requests */}
              <section>
                 <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[15px] font-bold text-ink-900 dark:text-white">Maintenance Requests</h4>
                    <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">View All</button>
                 </div>
                 
                 <div className="bg-white dark:bg-white/5 border border-ink-100 dark:border-white/10 rounded-2xl overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[400px]">
                       <thead className="bg-[#FAFAFA] dark:bg-white/5 text-ink-500 dark:text-white/60 text-[11px] font-semibold border-b border-ink-100 dark:border-white/10">
                          <tr>
                             <th className="px-5 py-3 font-semibold">Date ↕</th>
                             <th className="px-5 py-3 font-semibold">Issue Description ↕</th>
                             <th className="px-5 py-3 font-semibold text-center">Status ↕</th>
                             <th className="px-5 py-3 font-semibold text-center">Priority ↕</th>
                             <th className="px-5 py-3 font-semibold text-center">Action</th>
                          </tr>
                       </thead>
                       <tbody className="text-[12.5px] font-bold text-ink-900 dark:text-white">
                          {maintenanceRequests.length === 0 ? (
                            <tr>
                               <td colSpan="5" className="px-5 py-8 text-center text-ink-400 dark:text-white/50 font-semibold text-xs border-b border-ink-100 dark:border-white/5 last:border-0">No records found.</td>
                            </tr>
                          ) : (
                            maintenanceRequests.slice(0,3).map((req, i) => (
                              <tr key={i} className="border-b border-ink-100 dark:border-white/5 last:border-0 hover:bg-ink-50/50 dark:hover:bg-white/5">
                                 <td className="px-5 py-4 whitespace-nowrap">{new Date(req.date).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: '2-digit'})}</td>
                                 <td className="px-5 py-4">{req.description}</td>
                                 <td className="px-5 py-4 text-center">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] ${req.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
                                      {req.status}
                                    </span>
                                 </td>
                                 <td className={`px-5 py-4 text-center ${req.priority === 'High' ? 'text-rose-500' : 'text-ink-900 dark:text-white'}`}>{req.priority}</td>
                                 <td className="px-5 py-4 text-center">
                                    <button className="text-ink-400 hover:text-ink-900 dark:text-white/50 dark:hover:text-white transition-colors cursor-pointer">
                                       <MessageSquare className="w-4 h-4" />
                                    </button>
                                 </td>
                              </tr>
                            ))
                          )}
                       </tbody>
                    </table>
                 </div>
              </section>

              {/* Payment History */}
              <section>
                 <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[15px] font-bold text-ink-900 dark:text-white">Payment History</h4>
                    <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">View All</button>
                 </div>
                 
                 <div className="bg-white dark:bg-white/5 border border-ink-100 dark:border-white/10 rounded-2xl overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[400px]">
                       <thead className="bg-[#FAFAFA] dark:bg-white/5 text-ink-500 dark:text-white/60 text-[11px] font-semibold border-b border-ink-100 dark:border-white/10">
                          <tr>
                             <th className="px-5 py-3 font-semibold">Date ↕</th>
                             <th className="px-5 py-3 font-semibold text-center">Amount ↕</th>
                             <th className="px-5 py-3 font-semibold text-center">Payment Method ↕</th>
                             <th className="px-5 py-3 font-semibold text-center">Status ↕</th>
                          </tr>
                       </thead>
                       <tbody className="text-[12.5px] font-bold text-ink-900 dark:text-white">
                          {paymentHistory.length === 0 ? (
                            <tr>
                               <td colSpan="4" className="px-5 py-8 text-center text-ink-400 dark:text-white/50 font-semibold text-xs border-b border-ink-100 dark:border-white/5 last:border-0">No records found.</td>
                            </tr>
                          ) : (
                            paymentHistory.slice(0,3).map((pay, i) => (
                              <tr key={i} className="border-b border-ink-100 dark:border-white/5 last:border-0 hover:bg-ink-50/50 dark:hover:bg-white/5">
                                 <td className="px-5 py-4 whitespace-nowrap">{new Date(pay.date).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})}</td>
                                 <td className="px-5 py-4 text-center">{pay.amount}</td>
                                 <td className="px-5 py-4 text-center">{pay.method}</td>
                                 <td className="px-5 py-4 text-center">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] ${pay.status === 'Overdue' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
                                      {pay.status}
                                    </span>
                                 </td>
                              </tr>
                            ))
                          )}
                       </tbody>
                    </table>
                 </div>
              </section>

           </div>
        </div>
      </div>
    </div>
  );
}
