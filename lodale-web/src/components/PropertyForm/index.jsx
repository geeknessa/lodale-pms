import { ArrowLeft, ArrowRight, CheckCircle2, Lock, ShieldCheck, User, Building2, Layers, SlidersHorizontal, LogOut, FileText, Image as ImageIcon } from "lucide-react";
import usePropertyFormState from "./usePropertyFormState";
import PropertyFormHeader from "./components/PropertyFormHeader";
import PropertyFormCapsuleNav from "./components/PropertyFormCapsuleNav";
import LandlordProfileModal from "./components/LandlordProfileModal";
import TourPortal from "./components/TourPortal";
import SuccessOverlay from "./components/SuccessOverlay";
import Step1IdentityLocation from "./components/Step1IdentityLocation";
import Step2UnitsSpecs from "./components/Step2UnitsSpecs";
import Step3AmenitiesRules from "./components/Step3AmenitiesRules";
import Step4LegalPhotos from "./components/Step4LegalPhotos";
import Step5OccupancySubmit from "./components/Step5OccupancySubmit";
import SubmitConfirmModal from "./components/SubmitConfirmModal";
import "../../pages/DashboardAddProperty.css";

const STEPS = [
  { id: 1, title: "Type & Location", desc: "Basic details", icon: Building2 },
  { id: 2, title: "Units & Specifications", desc: "Layout & pricing", icon: Layers },
  { id: 3, title: "Amenities & Guidelines", desc: "Facilities & terms", icon: SlidersHorizontal },
  { id: 4, title: "Legal & Photos", desc: "Proof & gallery", icon: ShieldCheck },
  { id: 5, title: "Occupancy & Submit", desc: "Availability status", icon: CheckCircle2 }
];

export default function PropertyForm({ isStandalone = false, initialEditId = null }) {
  const state = usePropertyFormState({ isStandalone, initialEditId });

  const {
    currentStep = 1,
    setCurrentStep = () => {},
    isEditing = false,
    isSubmitting = false,
    showSuccessOverlay = false,
    formError = "",
    errors = {},
    username = "Landlord Account",
    landlordAvatar = "",
    showLandlordProfileModal = false,
    setShowLandlordProfileModal = () => {},
    showNotificationsDropdown = false,
    setShowNotificationsDropdown = () => {},
    notificationsDropdownRef = null,
    notificationsList = [],
    unreadCount = 0,
    notificationsTab = "all",
    setNotificationsTab = () => {},
    runTour = false,
    setRunTour = () => {},
    tourStep = 0,
    setTourStep = () => {},
    spotlightStyle = {},
    tooltipStyle = {},
    handlePrevStep = () => {},
    handleNextStep = () => {},
    handleSubmit = () => {},
    handleMarkAllNotificationsAsRead = () => {},
    handleDeleteNotification = () => {},
    navigate = () => {}
  } = state || {};

  const displayError = formError || errors?.general;
  const currentStepObj = STEPS.find((s) => s.id === currentStep) || STEPS[0];
  const CurrentStepIcon = currentStepObj.icon;

  return (
    <div className="dap-saas-page">
      <PropertyFormHeader
        isStandalone={isStandalone}
        isEditing={isEditing}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        setFormError={state.setFormError}
        navigate={navigate}
        showNotifDropdown={state.showNotifDropdown}
        setShowNotifDropdown={state.setShowNotifDropdown}
        notifications={state.notifications || []}
        unreadNotifCount={state.unreadCount || 0}
        markAllNotifsRead={state.markAllNotifsRead}
        setNotifications={state.setNotifications}
        setTourStep={setTourStep}
        setRunTour={setRunTour}
        setShowLandlordProfileModal={setShowLandlordProfileModal}
        landlordAvatar={landlordAvatar}
        username={username}
        isStepValid={state.isStepValid}
      />

      <div className="dap-workspace-layout">
        {/* ORIGINAL STICKY LEFT SIDEBAR */}
        <aside className="dap-left-panel">
          <div>
            <div className="dap-panel-section-title">PORTFOLIO ONBOARDING</div>
            <nav className="space-y-1">
              {STEPS.map((stepItem) => {
                const isActive = currentStep === stepItem.id;
                const isCompleted = state?.isStepValid ? state.isStepValid(stepItem.id) : false;
                const isAccessible = state?.canAccessStep ? state.canAccessStep(stepItem.id) : stepItem.id === 1;
                const StepIcon = stepItem.icon;

                return (
                  <button
                    key={stepItem.id}
                    type="button"
                    disabled={!isAccessible}
                    onClick={() => {
                      if (isAccessible) {
                        setCurrentStep(stepItem.id);
                      } else if (state?.setFormError) {
                        state.setFormError("Please complete Step 1 (Building Category, Display Name, Street Address, State, City) to unlock further steps.");
                      }
                    }}
                    className={`dap-step-nav-btn tour-step-nav-${stepItem.id} ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""} ${!isAccessible ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <StepIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{stepItem.title}</span>
                    <span className="dap-step-nav-badge">
                      {!isAccessible ? "🔒" : isCompleted ? "✓" : stepItem.id}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          <button
            type="button"
            onClick={() => navigate(isStandalone ? "/" : "/dashboard/landlord")}
            className="dap-sidebar-exit-btn"
          >
            <LogOut className="h-4 w-4" /> Exit Wizard
          </button>
        </aside>

        {/* INDEPENDENTLY SCROLLABLE CENTER WORKSPACE */}
        <main className="dap-center-content">
          <div className="dap-main-card">
            {displayError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <span>⚠️ {displayError}</span>
              </div>
            )}

            <div className="dap-card-header">
              <div className="dap-card-header-left">
                <div className="dap-card-icon-box">
                  <CurrentStepIcon className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="dap-card-heading">{currentStepObj.title}</h1>
                  <p className="dap-card-subheading">{currentStepObj.desc}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#2C4633] dark:text-[#E5C583] bg-[#2C4633]/10 dark:bg-[#E5C583]/10 px-3 py-1 rounded-full">
                Step {currentStep} of {STEPS.length}
              </span>
            </div>

            <div className="dap-card-progress-bar">
              <div
                className="dap-card-progress-fill"
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {currentStep === 1 && (
                <Step1IdentityLocation
                  displayName={state.displayName}
                  setDisplayName={state.setDisplayName}
                  propertyType={state.propertyType}
                  setPropertyType={state.setPropertyType}
                  houseSubtype={state.houseSubtype}
                  setHouseSubtype={state.setHouseSubtype}
                  isMultiUnit={state.isMultiUnit}
                  address={state.address}
                  setAddress={state.setAddress}
                  stateName={state.stateName}
                  setStateName={state.setStateName}
                  cityName={state.cityName}
                  setCityName={state.setCityName}
                />
              )}

              {currentStep === 2 && (
                <Step2UnitsSpecs
                  isMultiUnit={state.isMultiUnit}
                  setIsMultiUnit={state.setIsMultiUnit}
                  multiUnitType={state.multiUnitType}
                  setMultiUnitType={state.setMultiUnitType}
                  handleToggleMultiUnit={state.handleToggleMultiUnit}
                  propertyType={state.propertyType}
                  newBlockName={state.newBlockName}
                  setNewBlockName={state.setNewBlockName}
                  handleAddBlock={state.handleAddBlock}
                  blocksList={state.blocksList}
                  handleRemoveBlock={state.handleRemoveBlock}
                  unitsList={state.unitsList}
                  unitAddTab={state.unitAddTab}
                  setUnitAddTab={state.setUnitAddTab}
                  manualUnitName={state.manualUnitName}
                  setManualUnitName={state.setManualUnitName}
                  manualBeds={state.manualBeds}
                  setManualBeds={state.setManualBeds}
                  manualBaths={state.manualBaths}
                  setManualBaths={state.setManualBaths}
                  manualRent={state.manualRent}
                  setManualRent={state.setManualRent}
                  manualRentPeriod={state.manualRentPeriod}
                  setManualRentPeriod={state.setManualRentPeriod}
                  manualHostelPricingType={state.manualHostelPricingType}
                  setManualHostelPricingType={state.setManualHostelPricingType}
                  getUnitNamePlaceholder={state.getUnitNamePlaceholder}
                  handleAddSingleUnit={state.handleAddSingleUnit}
                  bulkPrefix={state.bulkPrefix}
                  setBulkPrefix={state.setBulkPrefix}
                  bulkStartNum={state.bulkStartNum}
                  setBulkStartNum={state.setBulkStartNum}
                  bulkCount={state.bulkCount}
                  setBulkCount={state.setBulkCount}
                  bulkBeds={state.bulkBeds}
                  setBulkBeds={state.setBulkBeds}
                  bulkBaths={state.bulkBaths}
                  setBulkBaths={state.setBulkBaths}
                  bulkRent={state.bulkRent}
                  setBulkRent={state.setBulkRent}
                  bulkRentPeriod={state.bulkRentPeriod}
                  setBulkRentPeriod={state.setBulkRentPeriod}
                  bulkHostelPricingType={state.bulkHostelPricingType}
                  setBulkHostelPricingType={state.setBulkHostelPricingType}
                  handleGenerateBulkUnits={state.handleGenerateBulkUnits}
                  csvFileInputRef={state.csvFileInputRef}
                  handleCsvUpload={state.handleCsvUpload || state.handleCsvFileUpload}
                  handleDeleteAllUnits={state.handleDeleteAllUnits}
                  editingUnitIndex={state.editingUnitIndex}
                  editingUnitForm={state.editingUnitForm}
                  setEditingUnitForm={state.setEditingUnitForm}
                  handleStartEditUnit={state.handleStartEditUnit}
                  handleSaveEditUnit={state.handleSaveEditUnit}
                  handleCancelEditUnit={state.handleCancelEditUnit}
                  handleEditingUnitImageUpload={state.handleEditingUnitImageUpload}
                  handleRemoveUnit={state.handleRemoveUnit}
                  bedrooms={state.bedrooms}
                  setBedrooms={state.setBedrooms}
                  bathrooms={state.bathrooms}
                  setBathrooms={state.setBathrooms}
                  rent={state.rent}
                  setRent={state.setRent}
                  rentCycle={state.rentCycle}
                  setRentCycle={state.setRentCycle}
                  singleHostelPricingType={state.singleHostelPricingType}
                  setSingleHostelPricingType={state.setSingleHostelPricingType}
                />
              )}

              {currentStep === 3 && (
                <Step3AmenitiesRules
                  wasBulkGenerated={state.wasBulkGenerated}
                  unitsList={state.unitsList}
                  description={state.description}
                  setDescription={state.setDescription}
                  selectedAmenities={state.selectedAmenities}
                  toggleAmenity={state.toggleAmenity}
                  customAddedAmenities={state.customAddedAmenities}
                  customAmenityInput={state.customAmenityInput}
                  setCustomAmenityInput={state.setCustomAmenityInput}
                  handleAddCustomAmenity={state.handleAddCustomAmenity}
                  requiredIncomeRange={state.requiredIncomeRange}
                  setRequiredIncomeRange={state.setRequiredIncomeRange}
                  employmentRequirement={state.employmentRequirement}
                  setEmploymentRequirement={state.setEmploymentRequirement}
                  requiresGuarantor={state.requiresGuarantor}
                  setRequiresGuarantor={state.setRequiresGuarantor}
                  selectedHouseRules={state.selectedHouseRules}
                  setSelectedHouseRules={state.setSelectedHouseRules}
                  customRuleInput={state.customRuleInput}
                  setCustomRuleInput={state.setCustomRuleInput}
                  rules={state.rules}
                  setRules={state.setRules}
                />
              )}

              {currentStep === 4 && (
                <Step4LegalPhotos
                  docType={state.docType}
                  setDocType={state.setDocType}
                  docName={state.docName}
                  docInputRef={state.docInputRef}
                  handleDocUpload={state.handleDocUpload || state.handleDocFileUpload}
                  wasBulkGenerated={state.wasBulkGenerated}
                  isMultiUnit={state.isMultiUnit}
                  propertyPhotos={state.propertyPhotos}
                  fileInputRef={state.fileInputRef}
                  handleFileUpload={state.handleFileUpload || state.handlePhotoUpload}
                  coverPhotoIndex={state.coverPhotoIndex}
                  setCoverPhotoIndex={state.setCoverPhotoIndex}
                  handleDeletePhoto={state.handleDeletePhoto}
                  unitsList={state.unitsList}
                  handleDirectUnitImageUpload={state.handleDirectUnitImageUpload}
                  handleDeleteUnitImage={state.handleDeleteUnitImage}
                />
              )}

              {currentStep === 5 && (
                <Step5OccupancySubmit
                  isMultiUnit={state.isMultiUnit}
                  unitsList={state.unitsList}
                  setUnitsList={state.setUnitsList}
                  occupied={state.occupied}
                  setOccupied={state.setOccupied}
                  tenantName={state.tenantName}
                  setTenantName={state.setTenantName}
                  tenantContact={state.tenantContact}
                  setTenantContact={state.setTenantContact}
                  leaseStartDate={state.leaseStartDate}
                  setLeaseStartDate={state.setLeaseStartDate}
                  availableFrom={state.availableFrom}
                  setAvailableFrom={state.setAvailableFrom}
                  isEditing={isEditing}
                  isFormFullyValid={state.isFormFullyValid}
                />
              )}
            </form>
          </div>

          <PropertyFormCapsuleNav
            currentStep={currentStep}
            handlePrevStep={handlePrevStep}
            handleNextStep={handleNextStep}
            handleSubmit={handleSubmit}
            isFormFullyValid={state.isFormFullyValid}
            canAccessStep={state.canAccessStep}
            isSubmitting={state.isSubmitting}
          />
        </main>
      </div>

      <SubmitConfirmModal
        showConfirmModal={state.showConfirmModal}
        setShowConfirmModal={state.setShowConfirmModal}
        isSubmitting={state.isSubmitting}
        handleConfirmSubmit={state.handleConfirmSubmit}
        displayName={state.displayName}
        propertyType={state.propertyType}
        address={state.address}
        cityName={state.cityName}
        stateName={state.stateName}
        isMultiUnit={state.isMultiUnit}
        unitsList={state.unitsList}
        rent={state.rent}
      />

      <TourPortal
        runTour={runTour}
        setRunTour={setRunTour}
        tourStep={tourStep}
        setTourStep={setTourStep}
        spotlightStyle={spotlightStyle}
        tooltipStyle={tooltipStyle}
      />

      <LandlordProfileModal
        showLandlordProfileModal={showLandlordProfileModal}
        setShowLandlordProfileModal={setShowLandlordProfileModal}
        landlordAvatar={landlordAvatar}
        username={username}
      />

      <SuccessOverlay
        showSuccessOverlay={showSuccessOverlay}
        isEditing={isEditing}
        onGoToDashboard={() => navigate("/dashboard/landlord")}
      />
    </div>
  );
}

