import { SITE_CONFIG } from "../site-config.js";
import { initializeSiteShell } from "../site-shell.js";
import {
  ACCESS_OPTIONS, AI_OPTIONS, APPROVALS, BRANCHES, COMMUNICATION, CRITICALITIES,
  DATA_COMPLEXITY, DATA_OPERATIONS, DATEV_OPTIONS, DOCUMENT_ACTIONS, DOCUMENTS,
  EMAIL_ACTIONS, EXCEPTIONS, HOSTING_OPTIONS, INDUSTRIES, PROCESSES, RPA_RISKS,
  RPA_SCREENS, RPA_STEPS, SYSTEM_GROUPS, TEST_ENVIRONMENTS, VOLUMES, getOptionLabel
} from "./calculator-config.js";
import { createStateStore, serializeConfiguration } from "./calculator-state.js";
import { formatCurrency, requestEstimate } from "./pricing-engine.js";
import { generateInternalSummary, generateLeadPayload, trackCalculatorEvent } from "./lead-summary.js";

initializeSiteShell();

const app = document.getElementById("calculatorApp");
const store = createStateStore();
let currentStepKey = "process";
let calculationStarted = false;

const BASE_STEPS = [
  { key: "process", label: "Unternehmen & Prozess", render: renderProcessStep, validate: validateProcess },
  { key: "systems", label: "Systeme", render: renderSystemsStep, validate: validateSystems },
  { key: "connections", label: "Verbindungen", render: renderConnectionsStep, validate: validateConnections },
  { key: "data", label: "Daten", render: renderDataStep, validate: validateData },
  { key: "content", label: "Dokumente & Kommunikation", render: renderContentStep, validate: validateContent },
  { key: "ai", label: "KI & Entscheidungen", render: renderAiStep, validate: validateAi },
  { key: "complexity", label: "Prozesskomplexität", render: renderComplexityStep, validate: validateComplexity },
  { key: "operations", label: "Betrieb & Infrastruktur", render: renderOperationsStep, validate: validateOperations },
  { key: "result", label: "Ergebnis", render: renderResultStep, validate: () => null }
];

function getSteps() {
  const state = store.getState();
  const steps = [...BASE_STEPS];
  const connectionIndex = steps.findIndex((step) => step.key === "connections");
  let insertionOffset = 1;
  if (state.systems.includes("DATEV")) {
    steps.splice(connectionIndex + insertionOffset, 0, { key: "datev", label: "DATEV Detailanalyse", render: renderDatevStep, validate: validateDatev });
    insertionOffset += 1;
  }
  const rpaRequired = Object.values(state.connections).some((access) => ["browser", "desktop", "remote", "visual"].includes(access));
  if (rpaRequired) steps.splice(connectionIndex + insertionOffset, 0, { key: "rpa", label: "RPA Detailanalyse", render: renderRpaStep, validate: validateRpa });
  return steps;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function choiceMarkup(option, { selected = false, type = "checkbox", group = "choice", data = "data-array", compact = false } = {}) {
  const isRadio = type === "radio";
  return `
    <label class="choice ${isRadio ? "radio" : ""} ${compact ? "compact-choice" : ""}">
      <input type="${type}" name="${escapeHtml(group)}" value="${escapeHtml(option.id)}" ${data}="${escapeHtml(group)}" ${selected ? "checked" : ""}>
      <span class="choice-body">
        <span class="choice-indicator" aria-hidden="true">${isRadio ? "" : "✓"}</span>
        <span class="choice-copy"><strong>${escapeHtml(option.label)}</strong>${option.description ? `<small>${escapeHtml(option.description)}</small>` : ""}</span>
      </span>
    </label>`;
}

function checkboxGrid(options, selected, group, className = "") {
  const values = new Set(selected || []);
  return `<div class="choice-grid ${className}">${options.map((item) => choiceMarkup(item, { selected: values.has(item.id), group })).join("")}</div>`;
}

function radioGrid(options, selected, group, className = "") {
  return `<div class="choice-grid ${className}">${options.map((item) => choiceMarkup(item, { selected: selected === item.id, type: "radio", group, data: "data-single" })).join("")}</div>`;
}

function stepLayout({ kicker, title, description, body, error = "" }) {
  return `<div class="step-panel"><span class="step-kicker">${escapeHtml(kicker)}</span><h2 class="step-title" tabindex="-1">${escapeHtml(title)}</h2>${description ? `<p class="step-description">${escapeHtml(description)}</p>` : ""}${body}<div class="error-message ${error ? "visible" : ""}" role="alert" tabindex="-1">${escapeHtml(error)}</div>${navigationMarkup()}</div>`;
}

function navigationMarkup() {
  const steps = getSteps();
  const index = steps.findIndex((step) => step.key === currentStepKey);
  return `<div class="step-actions">
    ${index > 0 ? '<button type="button" class="btn btn-quiet" data-action="back"><span aria-hidden="true">←</span> Zurück</button>' : "<span></span>"}
    <div class="step-actions-right"><button type="button" class="btn btn-primary" data-action="next">${steps[index + 1]?.key === "result" ? "Budget berechnen" : "Weiter"} <span aria-hidden="true">→</span></button></div>
  </div>`;
}

function renderProcessStep(state, error) {
  const customSelected = state.processes.includes("custom");
  return stepLayout({
    kicker: "01 · Unternehmen & Prozess",
    title: "Was möchten Sie automatisieren?",
    description: "Wählen Sie alle Bereiche aus, die Teil des geplanten Ablaufs sind.",
    body: `<div class="field-section">${checkboxGrid(PROCESSES, state.processes, "processes")}</div>
      <div class="field-section" id="customDescriptionWrap" ${customSelected ? "" : "hidden"}>
        <label class="field-heading" for="processDescription">Beschreiben Sie kurz, was aktuell manuell passiert.</label>
        <textarea class="text-field" id="processDescription" data-text="description" maxlength="800" placeholder="Zum Beispiel: Rechnungen kommen per E-Mail, werden geprüft und manuell in DATEV übertragen.">${escapeHtml(state.description)}</textarea>
      </div>
      <div class="field-section"><div class="field-heading">In welcher Branche arbeiten Sie? <span class="field-help">(optional)</span></div>${radioGrid(INDUSTRIES, state.industry, "industry", "compact")}</div>`,
    error
  });
}

function renderSystemsStep(state, error) {
  const selected = new Set(state.systems);
  const groups = SYSTEM_GROUPS.map((group) => `<div class="category-block"><div class="category-label">${escapeHtml(group.label)}</div><div class="choice-grid system-grid">${group.options.map((item) => choiceMarkup(item, { selected: selected.has(item.id), group: "systems" })).join("")}</div></div>`).join("");
  const tags = state.customSystems.map((system) => `<span class="system-tag">${escapeHtml(system)}<button type="button" aria-label="${escapeHtml(system)} entfernen" data-remove-system="${escapeHtml(system)}">×</button></span>`).join("");
  return stepLayout({
    kicker: "02 · Systeme",
    title: "Welche Systeme sind beteiligt?",
    description: "Mehrfachauswahl möglich. Falls ein System fehlt, können Sie es ergänzen.",
    body: `<div class="field-section">${groups}</div><div class="field-section"><label class="field-heading" for="customSystem">Weiteres System</label><div class="custom-system-row"><input class="text-field" id="customSystem" maxlength="80" placeholder="Name des Systems"><button class="btn btn-secondary" type="button" data-action="add-system">+ Weiteres System</button></div><div class="custom-system-tags">${tags}</div></div>`,
    error
  });
}

function renderConnectionsStep(state, error) {
  const systems = [...state.systems, ...state.customSystems];
  const rows = systems.map((system) => {
    const selected = state.connections[system] || "";
    const current = ACCESS_OPTIONS.find((item) => item.id === selected);
    return `<div class="connection-card"><div class="connection-system"><span class="connection-monogram" aria-hidden="true">${escapeHtml(system.slice(0, 2).toUpperCase())}</span><strong>${escapeHtml(system)}</strong></div><div><label class="field-heading" for="connection-${slug(system)}">Zugangsart</label><select class="select-field" id="connection-${slug(system)}" data-connection="${escapeHtml(system)}"><option value="">Bitte auswählen</option>${ACCESS_OPTIONS.map((item) => `<option value="${item.id}" ${selected === item.id ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select><p class="connection-detail" data-connection-detail="${escapeHtml(system)}">${escapeHtml(current?.description || "Wählen Sie die passende oder die unklare Option.")}</p></div></div>`;
  }).join("");
  return stepLayout({
    kicker: "03 · Verbindungen",
    title: "Wie kann auf die Systeme zugegriffen werden?",
    description: "Wählen Sie pro System die aktuell bekannte Zugangsart. Eine unklare Anbindung ist völlig in Ordnung.",
    body: `<div class="field-section connection-list">${rows}</div><div class="info-note"><span aria-hidden="true">i</span><div><strong>Sie sind unsicher?</strong><br>Mit „Weiß ich nicht“ erhalten Sie trotzdem eine Budgetspanne. Wir empfehlen dann gegebenenfalls eine technische Prüfung.</div></div>`,
    error
  });
}

function renderDatevStep(state, error) {
  const scopeOptions = DATEV_OPTIONS.filter((item) => item.id !== "multiple_clients");
  return stepLayout({
    kicker: "Detailanalyse · DATEV",
    title: "Was soll mit DATEV passieren?",
    description: "Die konkrete Tiefe ersetzt in der Kalkulation eine pauschale ERP-Anbindung und verhindert Doppelberechnung.",
    body: `<div class="field-section">${checkboxGrid(scopeOptions, state.datev.scope, "datev.scope")}</div><div class="field-section">${choiceMarkup(DATEV_OPTIONS.find((item) => item.id === "multiple_clients"), { selected: state.datev.multipleClients, group: "datev.multipleClients", data: "data-boolean" })}</div>`,
    error
  });
}

function renderRpaStep(state, error) {
  return stepLayout({
    kicker: "Detailanalyse · Bediente Oberfläche",
    title: "Wie aufwendig ist die Bedienung ungefähr?",
    description: "Diese Angaben helfen, Web-, Desktop- oder Remote-Automatisierungen realistisch einzuordnen.",
    body: `<div class="field-section"><div class="field-heading">Wie viele Bedienungsschritte sind ungefähr notwendig?</div>${radioGrid(RPA_STEPS, state.rpa.steps, "rpa.steps")}</div><div class="field-section"><div class="field-heading">Wie viele unterschiedliche Masken / Ansichten?</div>${radioGrid(RPA_SCREENS, state.rpa.screens, "rpa.screens")}</div><div class="field-section"><div class="field-heading">Welche Besonderheiten treffen zu?</div>${checkboxGrid(RPA_RISKS, state.rpa.risks, "rpa.risks")}</div><div class="rpa-notice"><span aria-hidden="true">!</span><div>Mehrfaktor-Anmeldungen oder Sicherheitsabfragen werden nicht umgangen. Wo erforderlich, planen wir einen sicheren menschlichen Schritt oder eine offizielle Maschinenidentität ein.</div></div>`,
    error
  });
}

function renderDataStep(state, error) {
  return stepLayout({
    kicker: "04 · Daten",
    title: "Was soll mit den Daten passieren?",
    description: "Wählen Sie alle Operationen und die am ehesten passende Datenstruktur.",
    body: `<div class="field-section">${checkboxGrid(DATA_OPERATIONS, state.dataOperations, "dataOperations")}</div><div class="field-section"><div class="field-heading">Wie einheitlich sind die Daten?</div>${radioGrid(DATA_COMPLEXITY, state.dataComplexity, "dataComplexity")}</div>`,
    error
  });
}

function renderContentStep(state, error) {
  return stepLayout({
    kicker: "05 · Dokumente & Kommunikation",
    title: "Welche Inhalte werden verarbeitet?",
    description: "Dokumente, Postfächer und Benachrichtigungen werden als zusammenhängender Ablauf bewertet.",
    body: `<div class="field-section"><div class="field-heading">Dokumente und Dateien</div>${checkboxGrid(DOCUMENTS, state.documents, "documents", "compact")}</div><div class="field-section"><div class="field-heading">Was soll damit passieren?</div>${checkboxGrid(DOCUMENT_ACTIONS, state.documentActions, "documentActions", "compact")}</div><div class="field-section"><div class="field-heading">Was soll mit E-Mails passieren?</div>${checkboxGrid(EMAIL_ACTIONS, state.email.actions, "email.actions")}</div><div class="field-section"><div class="field-heading">Weitere Kommunikationskanäle</div>${checkboxGrid(COMMUNICATION, state.communication, "communication", "compact")}</div>`,
    error
  });
}

function renderAiStep(state, error) {
  return stepLayout({
    kicker: "06 · KI & Entscheidungen",
    title: "Soll KI eingesetzt werden?",
    description: "Wählen Sie die gewünschten KI-Aufgaben und geben Sie an, ob Menschen Entscheidungen prüfen oder freigeben.",
    body: `<div class="field-section">${checkboxGrid(AI_OPTIONS, state.ai, "ai")}</div><div class="field-section"><div class="field-heading">Gibt es manuelle Entscheidungen oder Freigaben?</div>${radioGrid(APPROVALS, state.approvals, "approvals")}</div>`,
    error
  });
}

function renderComplexityStep(state, error) {
  return stepLayout({
    kicker: "07 · Prozesskomplexität",
    title: "Wie viele unterschiedliche Wege kann der Prozess nehmen?",
    description: "Sonderfälle und Abzweigungen beeinflussen Tests, Fehlerbehandlung und laufende Stabilität.",
    body: `<div class="field-section">${radioGrid(BRANCHES, state.branches, "branches")}</div><div class="field-section"><div class="field-heading">Wie häufig treten Ausnahmen auf?</div>${radioGrid(EXCEPTIONS, state.exceptions, "exceptions")}</div>`,
    error
  });
}

function renderOperationsStep(state, error) {
  return stepLayout({
    kicker: "08 · Betrieb & Infrastruktur",
    title: "Wie soll die Automatisierung betrieben werden?",
    description: "Volumen, Ausfallwirkung und technische Umgebung bestimmen Monitoring und Betreuung.",
    body: `<div class="field-section"><div class="field-heading">Wie häufig läuft der Prozess?</div>${radioGrid(VOLUMES, state.volume, "volume")}</div><div class="field-section"><div class="field-heading">Was passiert bei einem Fehler?</div>${radioGrid(CRITICALITIES, state.criticality, "criticality")}</div><div class="field-section"><div class="field-heading">Gibt es eine Testumgebung?</div>${radioGrid(TEST_ENVIRONMENTS, state.testEnvironment, "testEnvironment", "compact")}</div><div class="field-section"><div class="field-heading">Wo soll die Automatisierung betrieben werden?</div>${radioGrid(HOSTING_OPTIONS, state.hosting, "hosting")}</div>`,
    error
  });
}

function renderResultStep(state) {
  const result = state.estimatedBudget;
  if (!result) return `<div class="step-panel"><p>Ihre Budgetspanne wird berechnet …</p></div>`;
  const processLabels = state.processes.map((id) => getOptionLabel(PROCESSES, id));
  const systemLabels = [...state.systems, ...state.customSystems];
  const connections = systemLabels.map((system) => `${system}: ${getOptionLabel(ACCESS_OPTIONS, state.connections[system])}`);
  const hostingMonthly = result.hosting.monthly
    ? `${formatNumber(result.hosting.monthly.min)}–${formatCurrency(result.hosting.monthly.max)}/Monat`
    : "Nutzungs-/Lizenzkosten separat";
  const discovery = result.discovery.required ? `<div class="discovery-card"><h3><span aria-hidden="true">⌁</span> Technische Analyse empfohlen</h3><p>Für Ihr Projekt sollten wir die beteiligten Systeme vor einem verbindlichen Angebot technisch prüfen.</p><span class="discovery-price">${escapeHtml(result.discovery.label)}: ${formatNumber(result.discovery.range.min)}–${formatCurrency(result.discovery.range.max)}</span></div>` : "";
  const modules = result.modules.map((item) => `<div class="module-card"><span aria-hidden="true">✓</span>${escapeHtml(item.name)}</div>`).join("");
  const priceBreakdown = renderPriceBreakdown(result);
  const summary = [
    ["Prozess", processLabels.join(", ")], ["Branche", getOptionLabel(INDUSTRIES, state.industry)],
    ["Systeme", systemLabels.join(", ")], ["Verbindungsarten", connections.join(" · ")],
    ["Daten", state.dataOperations.map((id) => getOptionLabel(DATA_OPERATIONS, id)).join(", ")],
    ["Dokumente", state.documents.map((id) => getOptionLabel(DOCUMENTS, id)).join(", ") || "Keine"],
    ["Kommunikation", state.communication.map((id) => getOptionLabel(COMMUNICATION, id)).join(", ") || "Keine"],
    ["KI", state.ai.map((id) => getOptionLabel(AI_OPTIONS, id)).join(", ")],
    ["Volumen", getOptionLabel(VOLUMES, state.volume)], ["Kritikalität", getOptionLabel(CRITICALITIES, state.criticality)],
    ["Hosting", getOptionLabel(HOSTING_OPTIONS, state.hosting)]
  ].map(([term, description]) => `<div class="summary-row"><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(description || "Nicht angegeben")}</dd></div>`).join("");

  return `<div class="result-panel"><div class="result-head"><div><span class="step-kicker">Ihre Budgetorientierung</span><h2 class="step-title" tabindex="-1">Ihre Automation auf einen Blick.</h2></div><span class="complexity-badge">Technische Komplexität: ${escapeHtml(result.complexity.publicLabel)}</span></div>
    <div class="result-primary-grid"><article class="result-budget"><div class="result-label">Geschätztes Projektbudget</div><h3 class="budget-value">${escapeHtml(result.budget.label)}</h3><p class="budget-caption">Einmalige Umsetzung · unverbindliche Orientierung</p></article><article class="result-care"><div class="result-label">Empfohlene Betreuung</div><h3 class="care-value">${escapeHtml(result.care.package)}</h3><div class="care-price">ab ${formatCurrency(result.care.monthlyFrom)}/Monat</div><p class="care-reason">${escapeHtml(result.care.reasons[0])}</p></article></div>
    ${discovery}
    <section class="result-section"><h3 class="result-section-title">Enthaltene Leistungsbereiche</h3><div class="module-grid">${modules}</div></section>
    ${priceBreakdown}
    <section class="result-section"><h3 class="result-section-title">Ihre Konfiguration</h3><dl class="summary-list">${summary}</dl></section>
    <section class="result-section"><h3 class="result-section-title">Technische Infrastruktur</h3><div class="hosting-card"><div><h3>${escapeHtml(result.hosting.name)}</h3><p>Care und Infrastruktur bleiben getrennte Positionen. Die Einrichtung ist in der Kalkulation berücksichtigt, soweit bereits gewählt.</p></div><div class="hosting-price">${hostingMonthly}</div></div></section>
    <section class="result-section price-explanation"><h3>Warum eine Preisspanne?</h3><p>Der tatsächliche Aufwand hängt unter anderem von vorhandenen Schnittstellen, Datenqualität, individuellen Geschäftsregeln, Zugriffsrechten und der technischen Umgebung ab. Nach einem kurzen Automation Check kann LiraTech den Aufwand genauer bestimmen.</p><p>Die Berechnung ist eine unverbindliche Budgetorientierung und kein verbindliches Angebot.</p><p>${escapeHtml(result.externalCostsNotice)}</p></section>
    <section class="result-cta" id="booking"><h3>Projekt mit LiraTech besprechen</h3><p>Im kostenlosen Automation Check klären wir die wichtigsten technischen Fragen und den sinnvollsten nächsten Schritt.</p><div class="result-cta-actions"><a class="btn btn-primary js-booking-link" href="${escapeHtml(SITE_CONFIG.bookingLink)}" target="_blank" rel="noopener" data-booking>Automation Check buchen <span aria-hidden="true">→</span></a></div></section>
    <div class="result-footer-actions"><button type="button" class="btn btn-quiet" data-action="reset">↻ Neue Kalkulation</button><button type="button" class="btn btn-secondary btn-small" data-action="print">Ergebnis drucken / als PDF</button></div>
  </div>`;
}

function renderPriceBreakdown(result) {
  const breakdown = result.breakdown;
  if (!breakdown) return "";
  const formatRange = (range) => range.min === range.max
    ? formatCurrency(range.min)
    : `${formatNumber(range.min)}–${formatCurrency(range.max)}`;
  const rows = breakdown.items.map((item) => `<tr><td><span class="breakdown-item-name">${escapeHtml(item.name)}</span>${item.overlapAdjusted ? '<small>Synergien mit anderen Bausteinen berücksichtigt</small>' : ""}</td><td>${formatRange(item)}</td></tr>`).join("");
  const uncertaintyRow = breakdown.uncertainty ? `<div class="calculation-row"><div><span>Unsicherheit bei noch offenen Angaben</span><small>Verbreitert nur die obere Grenze</small></div><strong>bis +${breakdown.uncertainty.maxPercent} % · ${formatCurrency(breakdown.uncertainty.maxAmount)}</strong></div>` : "";
  const floorRow = breakdown.floor.appliedMin || breakdown.floor.appliedMax ? `<div class="calculation-row"><div><span>Projekt-Mindestkorridor</span><small>Schützt vor einer unrealistisch niedrigen RPA-/Enterprise-Schätzung</small></div><strong>ab ${formatCurrency(breakdown.floor.value)}</strong></div>` : "";

  return `<section class="result-section price-breakdown"><div class="breakdown-heading"><div><h3 class="result-section-title">So setzt sich Ihre Budgetspanne zusammen</h3><p>Die Budgetanteile berücksichtigen bereits Überschneidungen zwischen zusammengehörenden Bausteinen. Dadurch wird derselbe Integrationsaufwand nicht doppelt berechnet.</p></div><span>Transparente Kalkulation</span></div>
    <div class="breakdown-table-wrap"><table class="breakdown-table"><thead><tr><th scope="col">Leistungsbereich</th><th scope="col">Budgetanteil</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><th scope="row">Zwischensumme nach Überschneidungen</th><td>${formatRange(breakdown.subtotal)}</td></tr></tfoot></table></div>
    <div class="calculation-stack"><div class="calculation-row"><div><span>Technischer Komplexitäts- und Risikopuffer</span><small>Schnittstellen, Testaufwand, Sonderfälle und Betriebsrisiko</small></div><strong>+${breakdown.risk.minPercent}–${breakdown.risk.maxPercent} % · ${formatNumber(breakdown.risk.minAmount)}–${formatCurrency(breakdown.risk.maxAmount)}</strong></div>${uncertaintyRow}${floorRow}<div class="calculation-row calculated-range"><div><span>Rechnerischer Korridor vor Rundung</span><small>Interne Kalkulation nach allen gewählten Faktoren</small></div><strong>${formatRange(breakdown.calculated)}</strong></div><div class="calculation-row public-range"><div><span>Kaufmännisch gerundete Budgetindikation</span><small>Die öffentlich gezeigte, bewusst nicht überpräzise Spanne</small></div><strong>${escapeHtml(result.budget.label)}</strong></div></div>
    <p class="breakdown-note">Die Aufstellung ist eine unverbindliche Aufwandsschätzung. Bei „ab“- oder „+“-Korridoren bestimmen wir die obere Grenze nach der empfohlenen technischen Analyse.</p>
  </section>`;
}

function validateProcess(state) {
  if (!state.processes.length) return "Bitte wählen Sie mindestens einen Prozess aus.";
  if (state.processes.includes("custom") && state.description.trim().length < 10) return "Beschreiben Sie den individuellen Prozess bitte kurz in mindestens zehn Zeichen.";
  return null;
}
function validateSystems(state) { return state.systems.length + state.customSystems.length ? null : "Bitte wählen Sie mindestens ein beteiligtes System aus."; }
function validateConnections(state) {
  const missing = [...state.systems, ...state.customSystems].filter((system) => !state.connections[system]);
  return missing.length ? `Bitte wählen Sie für ${missing.length === 1 ? missing[0] : "alle Systeme"} eine Zugangsart aus.` : null;
}
function validateDatev(state) { return state.datev.scope.length ? null : "Bitte wählen Sie mindestens einen DATEV-Umfang aus. Wenn Sie unsicher sind, wählen Sie „Noch unklar“."; }
function validateRpa(state) { return state.rpa.steps && state.rpa.screens ? null : "Bitte schätzen Sie Bedienungsschritte und Ansichten. „Unbekannt“ ist jeweils möglich."; }
function validateData(state) { return state.dataOperations.length && state.dataComplexity ? null : "Bitte wählen Sie mindestens eine Datenoperation und eine Datenstruktur aus."; }
function validateContent(state) {
  if (!state.documents.length) return "Bitte wählen Sie die verarbeiteten Inhalte oder „Keine Dokumente“ aus.";
  if (!state.documents.includes("none") && !state.documentActions.length) return "Bitte wählen Sie mindestens eine Dokumentaktion aus.";
  if (!state.communication.length) return "Bitte wählen Sie einen Kommunikationskanal oder „Keine weitere Kommunikation“ aus.";
  return null;
}
function validateAi(state) { return state.ai.length && state.approvals ? null : "Bitte wählen Sie eine KI-Option und eine Freigabeart aus."; }
function validateComplexity(state) { return state.branches && state.exceptions ? null : "Bitte wählen Sie Prozesswege und Ausnahmehäufigkeit aus."; }
function validateOperations(state) { return state.volume && state.criticality && state.testEnvironment && state.hosting ? null : "Bitte beantworten Sie alle vier Fragen zu Betrieb und Infrastruktur."; }

function renderCurrent(error = "") {
  const steps = getSteps();
  let step = steps.find((item) => item.key === currentStepKey);
  if (!step) { currentStepKey = steps[0].key; step = steps[0]; }
  app.innerHTML = step.render(store.getState(), error);
  updateProgress(steps, step);
  updateContext();
  requestAnimationFrame(() => app.querySelector(".step-title")?.focus({ preventScroll: true }));
}

function updateProgress(steps, current) {
  const questionSteps = steps.filter((step) => step.key !== "result");
  const result = current.key === "result";
  const index = result ? questionSteps.length : questionSteps.findIndex((step) => step.key === current.key) + 1;
  const percentage = result ? 100 : Math.round((index / questionSteps.length) * 100);
  document.getElementById("progressLabel").textContent = result ? "Auswertung abgeschlossen" : `Schritt ${index} von ${questionSteps.length} · ${current.label}`;
  document.getElementById("progressPercent").textContent = `${percentage} %`;
  document.getElementById("progressFill").style.width = `${percentage}%`;
  const progress = document.getElementById("progressBar");
  progress.setAttribute("aria-valuemax", String(questionSteps.length));
  progress.setAttribute("aria-valuenow", String(index));
}

function updateContext() {
  const state = store.getState();
  document.getElementById("selectedProcessCount").textContent = state.processes.length;
  document.getElementById("selectedSystemCount").textContent = state.systems.length + state.customSystems.length;
}

function slug(value) { return value.toLowerCase().replace(/[^a-z0-9äöüß]+/g, "-").replace(/^-|-$/g, ""); }
function formatNumber(value) { return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(value); }

function setNestedState(path, value) {
  const [root, child] = path.split(".");
  if (!child) store.update({ [root]: value });
  else store.update((state) => ({ [root]: { ...state[root], [child]: value } }));
}

function getNestedState(path) {
  const [root, child] = path.split(".");
  const state = store.getState();
  return child ? state[root]?.[child] : state[root];
}

function handleArrayChange(input) {
  const path = input.dataset.array;
  const exclusiveValues = { documents: "none", communication: "none", ai: "none" };
  const exclusive = exclusiveValues[path];
  if (exclusive && input.checked) {
    const selector = `input[data-array="${CSS.escape(path)}"]`;
    app.querySelectorAll(selector).forEach((candidate) => {
      if ((input.value === exclusive && candidate !== input) || (input.value !== exclusive && candidate.value === exclusive)) candidate.checked = false;
    });
  }
  const values = [...app.querySelectorAll(`input[data-array="${CSS.escape(path)}"]:checked`)].map((element) => element.value);
  setNestedState(path, values);
  if (path === "systems") {
    const customSystems = store.getState().customSystems;
    store.update((state) => ({
      connections: Object.fromEntries(Object.entries(state.connections).filter(([system]) => values.includes(system) || customSystems.includes(system)))
    }));
    if (values.includes("DATEV")) trackCalculatorEvent("calculator_datev_selected");
    if (input.checked) trackCalculatorEvent("calculator_system_selected", { system: input.value });
  }
  if (path === "processes") document.getElementById("customDescriptionWrap")?.toggleAttribute("hidden", !values.includes("custom"));
  updateContext();
}

app.addEventListener("change", (event) => {
  const input = event.target;
  if (input.matches("[data-array]")) handleArrayChange(input);
  if (input.matches("[data-single]")) setNestedState(input.dataset.single, input.value);
  if (input.matches("[data-boolean]")) setNestedState(input.dataset.boolean, input.checked);
  if (input.matches("[data-connection]")) {
    const system = input.dataset.connection;
    store.update((state) => ({ connections: { ...state.connections, [system]: input.value } }));
    const option = ACCESS_OPTIONS.find((item) => item.id === input.value);
    const detail = app.querySelector(`[data-connection-detail="${CSS.escape(system)}"]`);
    if (detail) detail.textContent = option?.description || "Wählen Sie die passende Option.";
    if (["browser", "desktop", "remote", "visual"].includes(input.value)) trackCalculatorEvent("calculator_rpa_selected", { system, access: input.value });
  }
});

app.addEventListener("input", (event) => {
  const input = event.target;
  if (input.matches("[data-text]")) setNestedState(input.dataset.text, input.value);
});

app.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  const removeButton = event.target.closest("[data-remove-system]");
  if (removeButton) {
    const system = removeButton.dataset.removeSystem;
    store.update((state) => {
      const connections = { ...state.connections };
      delete connections[system];
      return { customSystems: state.customSystems.filter((item) => item !== system), connections };
    });
    renderCurrent();
    return;
  }
  if (!button) return;

  if (button.dataset.action === "add-system") {
    const input = document.getElementById("customSystem");
    const value = input.value.trim();
    if (!value) { input.focus(); return; }
    const state = store.getState();
    if (![...state.systems, ...state.customSystems].some((system) => system.toLowerCase() === value.toLowerCase())) {
      store.update({ customSystems: [...state.customSystems, value] });
    }
    renderCurrent();
    document.getElementById("customSystem")?.focus();
    return;
  }
  if (button.dataset.action === "back") { navigate(-1); return; }
  if (button.dataset.action === "next") { await navigate(1); return; }
  if (button.dataset.action === "reset") {
    store.reset();
    currentStepKey = "process";
    renderCurrent();
    document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (button.dataset.action === "print") window.print();
});

app.addEventListener("click", (event) => {
  if (event.target.closest("[data-booking]")) trackCalculatorEvent("calculator_booking_clicked", { budget: store.getState().estimatedBudget?.budget });
});

async function navigate(direction) {
  const steps = getSteps();
  const index = steps.findIndex((step) => step.key === currentStepKey);
  const current = steps[index];
  if (direction > 0) {
    const error = current.validate(store.getState());
    if (error) { renderCurrent(error); requestAnimationFrame(() => app.querySelector(".error-message")?.focus()); return; }
    trackCalculatorEvent("calculator_step_completed", { step: current.key, position: index + 1 });
  }
  const next = steps[index + direction];
  if (!next) return;
  currentStepKey = next.key;
  if (next.key === "result") {
    app.innerHTML = '<div class="step-panel"><span class="step-kicker">Auswertung</span><h2 class="step-title" tabindex="-1">Ihre Budgetspanne wird berechnet …</h2></div>';
    updateProgress(steps, next);
    try {
      const result = await requestEstimate(store.getState());
      store.update({ estimatedBudget: result, careRecommendation: result.care, complexity: result.complexity });
      const payload = generateLeadPayload(store.getState(), result);
      trackCalculatorEvent("calculator_completed", { budget: result.budget, complexity: result.complexity.publicLabel });
      window.LiraTechCalculator = {
        getConfiguration: () => structuredClone(store.getState()),
        getLeadPayload: () => structuredClone(payload),
        getInternalSummary: () => generateInternalSummary(store.getState(), result),
        serializeConfiguration: () => serializeConfiguration(store.getState())
      };
    } catch (error) {
      currentStepKey = "operations";
      renderCurrent("Die Berechnung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.");
      return;
    }
  }
  renderCurrent();
  document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.getElementById("startCalculator")?.addEventListener("click", () => {
  if (!calculationStarted) {
    calculationStarted = true;
    trackCalculatorEvent("calculator_started");
  }
});

trackCalculatorEvent("calculator_viewed");
renderCurrent();
