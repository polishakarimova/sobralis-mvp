import type { Dispatch, SetStateAction } from "react";
import type { ViewerRole } from "@/types/event";

type ViewModeSwitcherProps = {
  viewerRole: ViewerRole;
  setViewerRole: Dispatch<SetStateAction<ViewerRole>>;
};

export default function ViewModeSwitcher({ viewerRole, setViewerRole }: ViewModeSwitcherProps) {
  const roles: { id: ViewerRole; title: string; description: string }[] = [{ id: "guest", title: "Гость", description: "видит только базовую информацию" }, { id: "organizer", title: "Организатор", description: "видит оплату, управление и личные допы" }, { id: "owner", title: "Представитель места", description: "видит заявки и допы для подготовки" }];
  return <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="text-xs font-black uppercase tracking-wide text-stone-500">Демо-режим ролей</div><h3 className="mt-1 font-black">Кто что видит?</h3><p className="mt-1 text-xs leading-5 text-stone-600">В реальном сервисе роль определяется авторизацией. Здесь переключатель нужен только для демонстрации.</p></div><div className="grid gap-2 sm:grid-cols-3">{roles.map((role) => <button key={role.id} onClick={() => setViewerRole(role.id)} className={`rounded-2xl px-4 py-3 text-left text-xs font-bold ${viewerRole === role.id ? "bg-stone-950 text-white" : "bg-stone-50 text-stone-700 hover:bg-stone-100"}`}><span className="block text-sm font-black">{role.title}</span><span className="mt-1 block opacity-75">{role.description}</span></button>)}</div></div></div>;
}
