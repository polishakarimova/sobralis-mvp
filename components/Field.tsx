/* eslint-disable @typescript-eslint/no-explicit-any */
export default function Field({ label, children }: any) {
  return <label className="block"><div className="mb-2 text-sm font-black text-stone-700">{label}</div>{children}</label>;
}
