import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, Moon, Sun } from "lucide-react";
import LogoCamera from "@/Components/LogoCamera";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";

const NAV_LINKS = [
  { to: "/salas", label: "Salas" },
  { to: "/dados", label: "Dados" },
  { to: "/relatorios", label: "Relatórios" },
  { to: "/monitoramento", label: "Monitoramento" },
  { to: "/perfil", label: "Perfil" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useUser();
  const { isLight, toggleTheme } = useTheme();

  const activePath = location.pathname;

  const ctas = useMemo(() => {
    if (usuario) {
      return [];
    }
    const items = [];
    if (activePath !== "/login") {
      items.push({ to: "/login", label: "Entrar", variant: "ghost" });
    }
    if (activePath !== "/cadastro") {
      items.push({ to: "/cadastro", label: "Cadastrar", variant: "primary" });
    }
    if (items.length === 0) {
      items.push({ to: "/", label: "Início", variant: "ghost" });
    }
    return items;
  }, [activePath, usuario]);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/login");
  };

  const closeMenu = () => setOpen(false);
  const nextThemeLabel = isLight ? "Modo escuro" : "Modo claro";
  const themeButtonClasses = isLight
    ? "inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-white"
    : "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10";
  const themeButtonMobileClasses = isLight
    ? "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white"
    : "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10";
  const themeButtonIconClasses = isLight
    ? "grid h-10 w-10 place-items-center rounded-lg border border-slate-300 bg-white/80 text-slate-800 shadow-sm transition hover:bg-white"
    : "grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-white/5 text-white transition hover:bg-white/10";

  return (
    <nav className="sticky top-0 z-50 border-b border-[#00D9FF]/20 bg-black/40 backdrop-blur-xl supports-[backdrop-filter]:bg-black/25">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="group inline-flex items-center gap-3" onClick={closeMenu}>
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 overflow-hidden">
            <LogoCamera size={20} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">FaceRec</span>
        </Link>

        <div className="hidden items-center gap-6 text-sm md:flex">
          {NAV_LINKS.map(({ to, label }) => {
            const isActive = activePath === to || activePath.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                onClick={closeMenu}
                className={`transition hover:text-white ${isActive ? "text-white font-semibold" : "text-slate-300"}`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Alternar para ${nextThemeLabel}`}
            className={themeButtonClasses}
          >
            {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span>{nextThemeLabel}</span>
          </button>
          {usuario ? (
            <>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white uppercase">
                  {usuario?.full_name?.[0] || usuario?.nome?.[0] || usuario?.email?.[0] || "?"}
                </span>
                <div className="min-w-[120px]">
                  <p className="text-xs font-semibold text-white leading-tight">{usuario?.full_name || usuario?.nome || "Usuário"}</p>
                  <p className="text-[11px] text-slate-400 leading-tight">Professor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </>
          ) : (
            ctas.map(({ to, label, variant }) => (
              <Link
                key={to}
                to={to}
                onClick={closeMenu}
                className={
                  variant === "primary"
                    ? "rounded-xl bg-gradient-to-b from-[#00D9FF] to-[#0288D1] px-5 py-2 font-medium text-[#0A1929] shadow-[0_8px_20px_rgba(2,136,209,0.45)] hover:brightness-110"
                    : "rounded-xl px-4 py-2 text-slate-200 hover:text-white"
                }
              >
                {label}
              </Link>
            ))
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Alternar para ${nextThemeLabel}`}
            className={themeButtonIconClasses}
          >
            {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-white"
            aria-label="Alternar menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 px-6 pb-4 md:hidden">
          <div className="flex flex-col gap-3 pt-3 text-sm">
            {NAV_LINKS.map(({ to, label }) => {
              const isActive = activePath === to || activePath.startsWith(`${to}/`);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={closeMenu}
                  className={`rounded-lg px-4 py-2 transition ${isActive ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10"}`}
                >
                  {label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Alternar para ${nextThemeLabel}`}
              className={themeButtonMobileClasses}
            >
              {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span>{nextThemeLabel}</span>
            </button>

            <div className="border-t border-white/10 pt-3">
              {usuario ? (
                <>
                  <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-base font-semibold text-white uppercase">
                      {usuario?.full_name?.[0] || usuario?.nome?.[0] || usuario?.email?.[0] || "?"}
                    </span>
                    <div className="text-sm text-slate-200">
                      <p className="font-semibold leading-tight">{usuario?.full_name || usuario?.nome || "Usuário"}</p>
                      <p className="text-xs text-slate-400 leading-tight">Professor</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20"
                  >
                    <LogOut className="h-4 w-4" /> Sair
                  </button>
                </>
              ) : (
                ctas.map(({ to, label, variant }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={closeMenu}
                    className={`inline-flex w-full justify-center rounded-xl px-4 py-2 text-sm font-medium transition ${
                      variant === "primary"
                        ? "bg-gradient-to-b from-[#00D9FF] to-[#0288D1] text-[#0A1929] shadow-[0_8px_20px_rgba(2,136,209,0.45)] hover:brightness-110"
                        : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
