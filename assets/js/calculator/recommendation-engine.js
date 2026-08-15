import { CARE, HOSTING, RPA_CARE } from "./pricing-config.js";

const RPA_CONNECTIONS = new Set(["browser", "desktop", "remote", "visual"]);

export function recommendCare(state, complexity) {
  const connectionTypes = Object.values(state.connections || {});
  const hasRpa = connectionTypes.some((type) => RPA_CONNECTIONS.has(type));
  const hasRemote = connectionTypes.includes("remote");
  const hasDesktop = connectionTypes.includes("desktop") || connectionTypes.includes("visual");
  const systemCount = (state.systems?.length || 0) + (state.customSystems?.length || 0);

  let key = "essential";
  if (systemCount > 2 || ["relevant", "business"].includes(state.criticality) || state.volume === "1000_10000") key = "business";
  if (hasRpa) key = "business";
  if (hasDesktop || hasRemote || ["business", "critical"].includes(state.criticality) || ["10000_100000", "over_100000"].includes(state.volume)) key = "critical";
  if (complexity.level === "ENTERPRISE" && systemCount >= 5) key = "managedPlus";

  const care = CARE[key];
  let monthlyFrom = care.monthly ?? care.monthlyFrom;
  let rpaSupplement = null;

  if (hasRpa) {
    const range = hasRemote ? RPA_CARE.remote : hasDesktop ? RPA_CARE.desktop : RPA_CARE.browser;
    rpaSupplement = {
      label: hasRemote ? "Legacy-/Remote-Prozessbetreuung" : hasDesktop ? "Desktop-Prozessbetreuung" : "Browser-Prozessbetreuung",
      min: range.min,
      max: range.max
    };
    monthlyFrom = Math.max(monthlyFrom, hasRemote ? CARE.critical.monthly : CARE.business.monthly);
    if (key === "essential" || key === "business") key = hasRemote ? "critical" : "business";
  }

  const selected = CARE[key];
  return {
    key,
    package: selected.name,
    monthlyFrom: Math.max(monthlyFrom, selected.monthly ?? selected.monthlyFrom),
    rpaSupplement,
    reasons: buildCareReasons(state, hasRpa, systemCount)
  };
}

function buildCareReasons(state, hasRpa, systemCount) {
  const reasons = [];
  if (hasRpa) reasons.push("laufende Betreuung der bedienten Oberfläche");
  if (systemCount > 2) reasons.push("Monitoring mehrerer beteiligter Systeme");
  if (["business", "critical"].includes(state.criticality)) reasons.push("erhöhte betriebliche Relevanz");
  if (["10000_100000", "over_100000"].includes(state.volume)) reasons.push("erhöhtes Prozessvolumen");
  if (!reasons.length) reasons.push("regelmäßiger Health Check und Basismonitoring");
  return reasons;
}

export function recommendHosting(state) {
  const selected = HOSTING[state.hosting] || HOSTING.unknown;
  return {
    key: state.hosting || "unknown",
    name: selected.name,
    setup: { min: selected.setup.min, max: selected.setup.max },
    monthly: selected.monthly ? { min: selected.monthly.min, max: selected.monthly.max } : null,
    externalCostsApply: true
  };
}
