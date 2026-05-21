/* eslint-disable @typescript-eslint/no-explicit-any */
export default function InfoCard({ label, value, compact = false }: any) {
  return <div className={`rounded-2xl border border-stone-200 bg-white ${compact ? "p-4" : "p-5"}`}><div className="text-xs font-bold uppercase tracking-wide text-stone-500">{label}</div><div className="mt-1 font-black text-stone-950">{value}</div></div>;
}
