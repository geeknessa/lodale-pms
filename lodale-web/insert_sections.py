import re

guest_dashboard_path = "c:/Users/VANESSA/Downloads/lodale-web/lodale-web/src/pages/GuestDashboard.jsx"

with open(guest_dashboard_path, "r", encoding="utf-8") as f:
    content = f.read()

who_lodale_is_for = """
function WhoLodaleIsForSection({ C, isDark }) {
  const users = [
    {
      title: "TENANTS",
      desc: "Find and manage your next home.",
    },
    {
      title: "LANDLORDS",
      desc: "Manage your properties and applicants.",
    },
    {
      title: "PROPERTY MANAGERS",
      desc: "Keep property operations organised in one place.",
    }
  ];

  return (
    <section style={{ backgroundColor: isDark ? "#07130D" : "#F7F5EF", padding: "clamp(80px, 12vw, 120px) clamp(20px, 6vw, 92px)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px" }}>
        {users.map((u, i) => (
          <div key={i} style={{ borderTop: `1px solid ${isDark ? "rgba(229,197,131,0.2)" : "rgba(28,25,23,0.15)"}`, paddingTop: "32px" }}>
            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", color: isDark ? "rgba(229,197,131,0.8)" : "rgba(28,25,23,0.6)", marginBottom: "16px" }}>
              {u.title}
            </h3>
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.4rem, 2vw, 1.8rem)", lineHeight: 1.3, color: isDark ? "#EDE8DF" : "#1C1917", margin: 0 }}>
              {u.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
"""

final_cta = """
function FinalCtaSection({ C, isDark }) {
  const navigate = useNavigate();
  return (
    <section style={{ position: "relative", padding: "clamp(100px, 15vw, 160px) clamp(20px, 6vw, 92px)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Background Image */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80" alt="Beautiful Architecture" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(7,19,13,0.9) 0%, rgba(7,19,13,0.6) 100%)" }} />
      </div>
      
      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: "800px" }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(3rem, 5vw, 4.5rem)", fontWeight: 400, color: "#EDE8DF", marginBottom: "48px", lineHeight: 1.1 }}>
          Property Management,<br/>
          <em style={{ fontStyle: "italic", color: "#E5C583" }}>Simplified.</em>
        </h2>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/signup")} style={{ background: "#EDE8DF", color: "#1C1917", border: "none", padding: "14px 32px", fontSize: "13px", fontWeight: 600, fontFamily: "'Inter', sans-serif", letterSpacing: "0.03em", borderRadius: "4px", cursor: "pointer", outline: "none", transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity="0.9"} onMouseLeave={e => e.currentTarget.style.opacity="1"}>
            Get Started
          </button>
          
          <button onClick={() => document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" })} style={{ background: "transparent", color: "#EDE8DF", border: "1px solid rgba(237,232,223,0.3)", padding: "13px 32px", fontSize: "13px", fontWeight: 600, fontFamily: "'Inter', sans-serif", letterSpacing: "0.03em", borderRadius: "4px", cursor: "pointer", outline: "none", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="rgba(237,232,223,0.1)"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
            Explore Properties
          </button>
        </div>
      </div>
    </section>
  );
}
"""

# Insert the components before export default function GuestDashboard
insert_idx = content.find("export default function GuestDashboard")
content = content[:insert_idx] + who_lodale_is_for + "\n" + final_cta + "\n\n" + content[insert_idx:]

# Insert the component calls before <Footer />
render_idx = content.rfind("<Footer />")
calls = "      {/* Who Lodale is For */}\n      <WhoLodaleIsForSection C={C} isDark={isDark} />\n\n      {/* Final CTA */}\n      <FinalCtaSection C={C} isDark={isDark} />\n\n      "
content = content[:render_idx] + calls + content[render_idx:]

with open(guest_dashboard_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added sections 6 and 7 to GuestDashboard.jsx")
