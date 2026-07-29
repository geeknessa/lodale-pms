import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import Input from "../components/Input";
import Button from "../components/Button";

export default function AddProperty() {
  const navigate = useNavigate();
  const [occupied, setOccupied] = useState(null); // null | true | false
  const [rentCycle, setRentCycle] = useState("annual"); // "annual" | "monthly"

  function handleSubmit(e) {
    e.preventDefault();
    navigate("/dashboard/landlord");
  }

  return (
    <div className="min-h-screen bg-cream-50 px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Logo className="mb-10" />

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-ink-200 bg-white p-8 shadow-sm"
        >
          <h1 className="font-display text-2xl font-bold text-ink-900">
            Add your first property
          </h1>
          <p className="mt-2 text-[14px] text-ink-700">
            No agency needed — list it yourself, whether it&rsquo;s vacant or
            already has a tenant.
          </p>

          <div className="mt-6 space-y-5">
            <Input
              id="address"
              label="Address / nickname"
              placeholder="2-Bed Flat, Lekki Phase 1"
              required
            />
            <Input
              id="type"
              label="Property type"
              placeholder="Apartment, duplex, etc."
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="rent"
                    className="block text-[13px] font-medium text-ink-700"
                  >
                    Rent amount ({rentCycle === "annual" ? "per annum" : "per month"})
                  </label>
                  <div className="inline-flex p-0.5 bg-cream-100 border border-ink-200 rounded-md">
                    <button
                      type="button"
                      onClick={() => setRentCycle("annual")}
                      className={`px-2 py-0.5 text-[10.5px] font-bold rounded transition-all cursor-pointer ${
                        rentCycle === "annual"
                          ? "bg-moss-700 text-white shadow-xs"
                          : "text-ink-700 hover:text-ink-900"
                      }`}
                    >
                      Annual
                    </button>
                    <button
                      type="button"
                      onClick={() => setRentCycle("monthly")}
                      className={`px-2 py-0.5 text-[10.5px] font-bold rounded transition-all cursor-pointer ${
                        rentCycle === "monthly"
                          ? "bg-moss-700 text-white shadow-xs"
                          : "text-ink-700 hover:text-ink-900"
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>
                <Input
                  id="rent"
                  placeholder={
                    rentCycle === "annual"
                      ? "₦2,500,000 / year"
                      : "₦200,000 / month"
                  }
                  required
                />
              </div>

              <div>
                <Input
                  id="bedrooms"
                  label="Bedrooms"
                  type="number"
                  placeholder="2"
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <span className="mb-3 block text-[13px] font-medium text-ink-700">
              Does this property already have a tenant?
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOccupied(true)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  occupied === true
                    ? "border-moss-600 bg-moss-600/[0.04]"
                    : "border-ink-200 hover:border-ink-400"
                }`}
              >
                <div className="font-semibold text-ink-900">Yes</div>
                <div className="mt-1 text-[12px] text-ink-700">
                  Invite them to link their profile
                </div>
              </button>
              <button
                type="button"
                onClick={() => setOccupied(false)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  occupied === false
                    ? "border-moss-600 bg-moss-600/[0.04]"
                    : "border-ink-200 hover:border-ink-400"
                }`}
              >
                <div className="font-semibold text-ink-900">
                  No, it&rsquo;s vacant
                </div>
                <div className="mt-1 text-[12px] text-ink-700">
                  List it publicly to find a tenant
                </div>
              </button>
            </div>
          </div>

          {occupied === true && (
            <div className="mt-6 space-y-5 rounded-xl bg-cream-50 p-5">
              <p className="text-[13px] font-medium text-ink-900">
                Invite your current tenant
              </p>
              <Input
                id="tenantName"
                label="Tenant's name"
                placeholder="Emeka O."
                required
              />
              <Input
                id="tenantContact"
                label="Tenant's phone or email"
                placeholder="emeka@example.com"
                required
              />
              <Input
                id="leaseStart"
                label="Lease start date"
                type="date"
                required
              />
            </div>
          )}

          {occupied === false && (
            <div className="mt-6 space-y-5 rounded-xl bg-cream-50 p-5">
              <p className="text-[13px] font-medium text-ink-900">
                Listing details
              </p>
              <Input
                id="description"
                label="Short description"
                placeholder="What makes this place great?"
              />
              <Input
                id="availableFrom"
                label="Available from"
                type="date"
                required
              />
            </div>
          )}

          <Button
            type="submit"
            className="mt-8 w-full"
            disabled={occupied === null}
          >
            {occupied === true
              ? "Send Invite & Add Property"
              : occupied === false
                ? "Publish Listing"
                : "Add Property"}
          </Button>
        </form>
      </div>
    </div>
  );
}
