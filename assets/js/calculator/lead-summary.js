import {
  AI_OPTIONS, APPROVALS, BRANCHES, COMMUNICATION, CRITICALITIES, DATA_OPERATIONS,
  DOCUMENT_ACTIONS, DOCUMENTS, HOSTING_OPTIONS, INDUSTRIES, PROCESSES, VOLUMES, getOptionLabel
} from "./calculator-config.js";
import { formatCurrency } from "./pricing-engine.js";

const CONNECTION_LABELS = {
  api: "Direkte Systemverbindung", file: "Datei-Austausch", database: "Datenbank",
  browser: "Weboberfläche", desktop: "Desktop-Programm", remote: "Remote Desktop / Citrix",
  visual: "Bildschirm-/Bilderkennung", unknown: "Zugangsart noch offen"
};

function labels(values, options) {
  return (values || []).map((value) => getOptionLabel(options, value));
}

export function generateLeadPayload(configuration, result) {
  return {
    calculatorVersion: result.version || "1.0",
    createdAt: new Date().toISOString(),
    industry: configuration.industry,
    processes: [...(configuration.processes || [])],
    description: configuration.description || "",
    systems: [...(configuration.systems || []), ...(configuration.customSystems || [])].map((name) => ({
      name, connection: configuration.connections?.[name] || "unknown"
    })),
    dataOperations: [...(configuration.dataOperations || [])],
    dataComplexity: configuration.dataComplexity,
    documents: [...(configuration.documents || [])],
    documentActions: [...(configuration.documentActions || [])],
    email: { actions: [...(configuration.email?.actions || [])] },
    communication: [...(configuration.communication || [])],
    ai: [...(configuration.ai || [])],
    approvals: configuration.approvals,
    branches: configuration.branches,
    exceptions: configuration.exceptions,
    volume: configuration.volume,
    criticality: configuration.criticality,
    testEnvironment: configuration.testEnvironment,
    hosting: configuration.hosting,
    rpa: structuredClone(configuration.rpa || {}),
    datev: structuredClone(configuration.datev || {}),
    complexity: { level: result.complexity.level, points: result.complexity.points },
    budget: { min: result.budget.min, max: result.budget.max, currency: "EUR", type: result.budget.type },
    care: { package: result.care.package, monthlyFrom: result.care.monthlyFrom },
    hostingRecommendation: result.hosting,
    discovery: { required: result.discovery.required, type: result.discovery.type },
    includedModules: result.modules.map((item) => item.id)
  };
}

export function generateInternalSummary(configuration, result) {
  const systemLines = [...(configuration.systems || []), ...(configuration.customSystems || [])]
    .map((name) => `${name} – ${CONNECTION_LABELS[configuration.connections?.[name]] || "Nicht angegeben"}`);
  const budget = result.budget.max ? `${formatCurrency(result.budget.min).replace(" €", "")}–${formatCurrency(result.budget.max)}` : result.budget.label;
  const risks = [];
  if ((configuration.systems || []).includes("DATEV")) risks.push("DATEV-Scope und Mandantenstruktur prüfen");
  if (["unknown", "ocr"].includes(configuration.dataComplexity)) risks.push("Dokumentformate und Datenqualität prüfen");
  if (Object.values(configuration.connections || {}).includes("unknown")) risks.push("Technische Zugangsarten verifizieren");
  if (result.diagnostics.rpaKey) risks.push("Oberflächenstabilität und Fallback prüfen");

  return [
    "LIRATECH AUTOMATION LEAD", "",
    "Branche:", getOptionLabel(INDUSTRIES, configuration.industry), "",
    "Use Case:", labels(configuration.processes, PROCESSES).join(", ") || "Nicht angegeben", "",
    "Systeme & Verbindungen:", systemLines.join("\n") || "Nicht angegeben", "",
    "Daten:", labels(configuration.dataOperations, DATA_OPERATIONS).join(", ") || "Keine Angabe", "",
    "Dokumente:", labels(configuration.documents, DOCUMENTS).join(", ") || "Keine", "",
    "Dokumentaktionen:", labels(configuration.documentActions, DOCUMENT_ACTIONS).join(", ") || "Keine", "",
    "Kommunikation:", labels(configuration.communication, COMMUNICATION).join(", ") || "Keine", "",
    "KI:", labels(configuration.ai, AI_OPTIONS).join(", ") || "Nein", "",
    "Freigaben:", getOptionLabel(APPROVALS, configuration.approvals), "",
    "Prozesswege:", getOptionLabel(BRANCHES, configuration.branches), "",
    "Volumen:", getOptionLabel(VOLUMES, configuration.volume), "",
    "Kritikalität:", getOptionLabel(CRITICALITIES, configuration.criticality), "",
    "Hosting:", getOptionLabel(HOSTING_OPTIONS, configuration.hosting), "",
    "Komplexität:", `${result.complexity.level} / ${result.complexity.points} Punkte`, "",
    "Budget:", budget, "",
    "Care:", `${result.care.package} – ab ${formatCurrency(result.care.monthlyFrom)}/Monat`, "",
    "Discovery:", result.discovery.required ? `${result.discovery.label} empfohlen` : "aktuell nicht zwingend", "",
    "Technische Risiken:", risks.join("\n") || "Keine besonderen Risiken aus der Vorauswahl"
  ].join("\n");
}

export function trackCalculatorEvent(name, payload = {}) {
  const detail = { name, payload, at: new Date().toISOString() };
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("liratech:calculator", { detail }));
  return detail;
}

export class RemoteLeadAdapter {
  constructor(endpoint) { this.endpoint = endpoint; }
  async submit(payload) {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Die Konfiguration konnte nicht übermittelt werden.");
    return response.status === 204 ? null : response.json();
  }
}

export async function submitCalculatorLead(payload, adapter) {
  if (!adapter) throw new Error("Kein Lead-Adapter konfiguriert.");
  const response = await adapter.submit(payload);
  trackCalculatorEvent("calculator_lead_submitted", { calculatorVersion: payload.calculatorVersion });
  return response;
}
