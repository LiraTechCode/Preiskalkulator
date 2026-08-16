import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, deserializeConfiguration, mergeState, serializeConfiguration } from "../assets/js/calculator/calculator-state.js";
import { buildSelectedModules, calculateEstimate } from "../assets/js/calculator/pricing-engine.js";

function scenario(patch) {
  return mergeState(createInitialState(), patch);
}

function assertBand(result, expectedMin, expectedMax) {
  assert.ok(result.budget.min >= expectedMin, `${result.budget.label} liegt unter ${expectedMin}`);
  if (result.budget.max !== null) assert.ok(result.budget.max <= expectedMax, `${result.budget.label} liegt über ${expectedMax}`);
}

test("A – ein klarer API-Workflow bleibt oberhalb des Projekt-Floors", () => {
  const result = calculateEstimate(scenario({
    systems: ["HubSpot"], connections: { HubSpot: "api" }, dataOperations: ["read"],
    dataComplexity: "structured", branches: "linear", exceptions: "rare",
    criticality: "standard", testEnvironment: "yes", volume: "under_100", hosting: "unknown"
  }));
  assert.ok(result.budget.min >= 2900);
  assert.equal(result.complexity.publicLabel, "Standard");
  assert.equal(result.breakdown.items.reduce((sum, item) => sum + item.min, 0), result.breakdown.subtotal.min);
  assert.equal(result.breakdown.items.reduce((sum, item) => sum + item.max, 0), result.breakdown.subtotal.max);
  assert.equal(result.breakdown.publicBudget.label, result.budget.label);
});

test("B – Excel zu E-Mail wird als kompakter Standard-Workflow kalibriert", () => {
  const result = calculateEstimate(scenario({
    systems: ["Excel"], connections: { Excel: "file" }, dataOperations: ["read"],
    dataComplexity: "structured", email: { actions: ["personalized"] }, communication: ["email"],
    branches: "linear", exceptions: "rare", criticality: "standard", testEnvironment: "yes",
    volume: "under_100", hosting: "unknown"
  }));
  assertBand(result, 3500, 7500);
});

test("C – DATEV, Outlook und PDF landen im Zielkorridor", () => {
  const state = scenario({
    processes: ["incoming_invoices"], systems: ["DATEV", "Outlook"],
    connections: { DATEV: "file", Outlook: "api" }, dataOperations: ["read", "write"],
    dataComplexity: "unstructured", documents: ["pdfs", "invoices"], documentActions: ["read", "store"],
    email: { actions: ["monitor", "save_attachments"] }, communication: ["email"],
    datev: { scope: ["extf"] }, branches: "some", exceptions: "some", criticality: "business",
    testEnvironment: "yes", volume: "100_1000", hosting: "unknown"
  });
  const result = calculateEstimate(state);
  assertBand(result, 7000, 12000);
  const ids = buildSelectedModules(state).modules.map((item) => item.id);
  assert.ok(ids.includes("datev_extf"));
  assert.ok(!ids.includes("connector_DATEV"));
  assert.ok(!ids.includes("connector_microsoft"));
  assert.ok(!ids.includes("communication_attachments"));
});

test("D – DATEV, SharePoint und intelligente Dokumentenverarbeitung", () => {
  const result = calculateEstimate(scenario({
    processes: ["incoming_invoices"], systems: ["DATEV", "SharePoint"],
    connections: { DATEV: "api", SharePoint: "api" }, dataOperations: ["read", "write"],
    dataComplexity: "unstructured", documents: ["pdfs", "invoices"],
    documentActions: ["extract", "understand_ai", "store"], ai: ["documents", "extract"],
    datev: { scope: ["full"] }, branches: "some", exceptions: "some", criticality: "business",
    testEnvironment: "partial", volume: "1000_10000", hosting: "unknown"
  }));
  assertBand(result, 10000, 18000);
});

test("E – Browser-Automation unterschreitet den RPA-Floor nicht", () => {
  const result = calculateEstimate(scenario({
    systems: ["Website"], connections: { Website: "browser" }, dataComplexity: "unstructured",
    documents: ["pdfs"], documentActions: ["read"], email: { actions: ["personalized"] },
    communication: ["email"], rpa: { steps: "under10", screens: "oneToThree", risks: [] },
    branches: "linear", exceptions: "rare", criticality: "standard", testEnvironment: "yes",
    volume: "under_100", hosting: "unknown"
  }));
  assert.ok(result.budget.min >= 7500);
  assert.equal(result.diagnostics.floor, 7500);
});

test("F – Immobilienportal ohne Schnittstelle wird als Browser-Automation bewertet", () => {
  const result = calculateEstimate(scenario({
    industry: "real_estate", processes: ["crm"], systems: ["ImmobilienScout24", "HubSpot"],
    connections: { ImmobilienScout24: "browser", HubSpot: "api" }, dataOperations: ["read", "write"],
    dataComplexity: "structured", email: { actions: ["personalized"] }, communication: ["email"],
    rpa: { steps: "between10And30", screens: "fourToEight", risks: [] }, branches: "some",
    exceptions: "some", criticality: "relevant", testEnvironment: "yes", volume: "100_1000", hosting: "unknown"
  }));
  assert.ok(result.budget.min >= 8000);
  assert.ok(result.budget.min <= 15000);
});

test("G – OrgaMAX Enterprise über Remote wird nie als kleiner Workflow kalkuliert", () => {
  const result = calculateEstimate(scenario({
    processes: ["incoming_invoices"], systems: ["OrgaMAX Enterprise"],
    connections: { "OrgaMAX Enterprise": "remote" }, dataComplexity: "unstructured",
    documents: ["pdfs", "invoices"], documentActions: ["read"],
    rpa: { steps: "between30And60", screens: "ninePlus", risks: ["remote", "dialogs", "no_test"] },
    branches: "many", exceptions: "many", criticality: "business", testEnvironment: "production",
    volume: "100_1000", hosting: "remote_environment"
  }));
  assert.equal(result.complexity.level, "ENTERPRISE");
  assert.equal(result.budget.min, 15000);
  assert.equal(result.budget.max, 25000);
  assert.equal(result.discovery.required, true);
  assert.equal(result.care.package, "Care Critical");
});

test("H – Audit-Dokumentenflow bleibt im kalibrierten Korridor", () => {
  const result = calculateEstimate(scenario({
    industry: "audit", processes: ["document_processing"], systems: ["Outlook", "SharePoint"],
    connections: { Outlook: "api", SharePoint: "api" }, dataComplexity: "ocr",
    documents: ["emails", "scans"], documentActions: ["read", "classify", "store"],
    email: { actions: ["monitor", "save_attachments"] }, communication: ["email"],
    ai: ["documents", "classify"], approvals: "human_ai", branches: "some", exceptions: "some",
    criticality: "relevant", testEnvironment: "partial", volume: "1000_10000", hosting: "unknown"
  }));
  assertBand(result, 10000, 18000);
});

test("I – KI-Service-Postfach vermeidet doppelte Routing- und Review-Module", () => {
  const state = scenario({
    processes: ["customer_service"], systems: ["Outlook", "HubSpot"],
    connections: { Outlook: "api", HubSpot: "api" }, dataComplexity: "unstructured",
    documents: ["emails"], email: { actions: ["monitor", "classify", "draft_reply"] },
    communication: ["email"], ai: ["emails", "draft"], approvals: "human_ai", branches: "some",
    exceptions: "some", criticality: "relevant", testEnvironment: "yes", volume: "1000_10000", hosting: "unknown"
  });
  const result = calculateEstimate(state);
  assertBand(result, 8000, 18000);
  const ids = buildSelectedModules(state).modules.map((item) => item.id);
  assert.ok(!ids.includes("communication_routing"));
  assert.ok(!ids.includes("ai_human_review"));
});

test("J – kritischer bidirektionaler Multi-System-Prozess liegt bei mindestens 20.000 Euro", () => {
  const result = calculateEstimate(scenario({
    processes: ["data_sync"], systems: ["SAP", "Salesforce", "SharePoint", "Shopify", "Datenbank"],
    connections: { SAP: "api", Salesforce: "api", SharePoint: "api", Shopify: "api", Datenbank: "database" },
    dataOperations: ["bidirectional", "multi_sync"], dataComplexity: "mixed", ai: ["agent"],
    branches: "many", exceptions: "many", criticality: "critical", testEnvironment: "production",
    volume: "10000_100000", hosting: "managed"
  }));
  assert.ok(["HIGH", "ENTERPRISE"].includes(result.complexity.level));
  assert.ok(result.budget.min >= 20000);
  assert.equal(result.discovery.required, true);
});

test("Konfiguration lässt sich ohne Ergebnis- oder Personendaten teilen", () => {
  const state = scenario({ processes: ["custom"], description: "Prüfung für Müller & Söhne", systems: ["DATEV"] });
  state.estimatedBudget = { internal: "nicht serialisieren" };
  const serialized = serializeConfiguration(state);
  const restored = deserializeConfiguration(serialized);
  assert.equal(restored.description, "");
  assert.deepEqual(restored.systems, ["DATEV"]);
  assert.equal(restored.estimatedBudget, null);
});
