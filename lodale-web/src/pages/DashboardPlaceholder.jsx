import { useParams } from "react-router-dom";

export default function DashboardPlaceholder() {
  const { role } = useParams();
  return (
    <div className="min-h-screen bg-cream-50 px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-2xl font-semibold text-ink-900 capitalize">
          {role} Dashboard
        </h1>
        <p className="mt-2 text-[14px] text-ink-700">Placeholder</p>
      </div>
    </div>
  );
}
