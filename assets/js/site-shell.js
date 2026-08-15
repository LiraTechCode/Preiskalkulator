import { applySiteConfig } from "./site-config.js";

export function initializeSiteShell() {
  applySiteConfig(document);
  initializeNavigation();
  initializeCookieBanner();
}

function initializeNavigation() {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");
  if (!toggle || !nav) return;
  const close = () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Menü öffnen");
  };
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
}

function initializeCookieBanner() {
  const key = "liratech-cookie-consent";
  const banner = document.getElementById("cookieBanner");
  const read = () => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
  const write = (value) => { try { localStorage.setItem(key, JSON.stringify({ value, date: new Date().toISOString() })); } catch { /* graceful fallback */ } };
  const show = () => banner?.classList.add("visible");
  const hide = () => banner?.classList.remove("visible");
  if (banner && !read()) show();
  document.getElementById("cookieAccept")?.addEventListener("click", () => { write("all"); hide(); });
  document.getElementById("cookieReject")?.addEventListener("click", () => { write("necessary"); hide(); });
  document.getElementById("cookieSettingsLink")?.addEventListener("click", (event) => { event.preventDefault(); show(); });
  window.getCookieConsent = read;
}
