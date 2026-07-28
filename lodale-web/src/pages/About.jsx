import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-text transition-colors duration-250">
      <NavBar />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-3xl font-bold text-theme-text">
          About Lodale
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-theme-text-offset">
          Renting in Nigeria runs on guesswork. Landlords have no real way to
          check a tenant before handing over keys. Tenants have no way to know
          if a landlord fixes things, or returns deposits fairly, until it's too
          late to change their mind.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-theme-text-offset">
          Lodale does everything the property apps you already know do — rent
          tracking, maintenance requests, digital leases — plus the one thing
          they don't: a mutual, verified track record, visible to both sides
          before anyone commits.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-theme-text-offset">
          Every user verifies their identity with their NIN. Every completed
          lease produces a rating. No agency required to list a property, and no
          guessing required to trust the person on the other side of the lease.
        </p>
      </div>
      <Footer />
    </div>
  );
}
