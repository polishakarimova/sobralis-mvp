/* eslint-disable @typescript-eslint/no-explicit-any */
export default function Header({ setScreen, goBrowse }: any) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <button onClick={() => setScreen("home")} className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-950 text-lg font-black text-white">С</div>
          <div>
            <div className="text-lg font-black tracking-tight">Собрались</div>
            <div className="text-xs text-stone-500">Калининград · демо-MVP</div>
          </div>
        </button>
        <nav className="hidden items-center gap-2 md:flex">
          <button onClick={() => goBrowse()} className="rounded-full px-4 py-2 text-sm font-medium text-stone-700 hover:bg-white">Места</button>
          <button onClick={() => setScreen("partners")} className="rounded-full px-4 py-2 text-sm font-medium text-stone-700 hover:bg-white">Для владельцев</button>
          <button onClick={() => setScreen("organizers")} className="rounded-full px-4 py-2 text-sm font-medium text-stone-700 hover:bg-white">Для организаторов</button>
        </nav>
        <button onClick={() => setScreen("builder")} className="rounded-full bg-stone-950 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-stone-800">Создать отдых</button>
      </div>
    </header>
  );
}
