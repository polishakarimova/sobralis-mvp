/* eslint-disable @typescript-eslint/no-explicit-any */
export default function AlternativesPanel({ alternativePlaces, createHere }: any) {
  return <div className="mt-4 rounded-2xl border border-rose-100 bg-white p-4"><h3 className="font-black text-rose-800">Этот слот занят</h3><p className="mt-1 text-sm text-stone-600">Чтобы человек не упирался в тупик, сервис сразу предлагает похожие места или другое время.</p><div className="mt-3 grid gap-2">{alternativePlaces.map((place: any) => <button key={place.id} onClick={() => createHere(place)} className="rounded-2xl bg-stone-50 px-4 py-3 text-left text-sm font-bold hover:bg-stone-100">{place.title} · {place.perHour}</button>)}</div></div>;
}
