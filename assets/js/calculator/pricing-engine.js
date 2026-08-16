import {
  AI_MODULES, AUDIT_MODULES, AUTOMATION_CORE, BUSINESS_MODULES, COMMUNICATION_MODULES,
  COMPLEXITY_RISK, DATA_MODULES, DATEV_MODULES, DISCOVERY, DOCUMENT_MODULES,
  FINANCE_MODULES, HOSTING, INTEGRATION_MODULES, PROJECT_FLOORS, PUBLIC_BUDGET_BANDS,
  REAL_ESTATE_MODULES, RPA_MODULES, SECURITY_MODULES, TECHNICAL_MODULES, VOICE_MODULES
} from "./pricing-config.js";
import { recommendCare, recommendHosting } from "./recommendation-engine.js";

// TODO:
// Move pricing calculation to server-side endpoint before exposing confidential
// pricing logic in a production environment where hiding internal pricing is required.

const RPA_ACCESS = new Set(["browser", "desktop", "remote", "visual"]);
const MICROSOFT_SYSTEMS = new Set(["Outlook", "Exchange", "Microsoft 365", "Microsoft Graph", "SharePoint", "OneDrive", "Excel", "Teams"]);
const GOOGLE_SYSTEMS = new Set(["Gmail", "Google Drive", "Google Sheets", "Google Calendar", "Google Workspace"]);
const CRM_SYSTEMS = new Set(["HubSpot", "Salesforce", "Pipedrive", "Zoho", "individuelles CRM"]);
const ERP_SYSTEMS = new Set(["SAP", "Microsoft Dynamics", "OrgaMAX", "OrgaMAX Enterprise", "Lexware", "sevDesk", "Xero", "individuelles ERP"]);
const REAL_ESTATE_SYSTEMS = new Set(["Immoware24", "casavi", "DOMUS", "PowerHaus", "Wodis Sigma", "Haufe", "EverReal", "ImmobilienScout24", "Immowelt", "eigenes Immobilienportal"]);

function module(id, name, category, range, options = {}) {
  return {
    id, name, category, minPrice: range.min, maxPrice: range.max,
    publicLabel: options.publicLabel || name, dependencies: options.dependencies || [],
    replaces: options.replaces || [], excludes: options.excludes || [],
    complexityPoints: options.complexityPoints || 0,
    discoveryRequired: Boolean(options.discoveryRequired), internalOnly: Boolean(options.internalOnly),
    standalone: Boolean(options.standalone), system: options.system || null
  };
}

function addUnique(modules, candidate) {
  if (!candidate || modules.some((item) => item.id === candidate.id)) return;
  modules.push(candidate);
}

function selectRpaModule(state, modules) {
  const accessTypes = Object.values(state.connections || {});
  const rpaTypes = accessTypes.filter((type) => RPA_ACCESS.has(type));
  if (!rpaTypes.length) return null;

  const steps = state.rpa?.steps;
  const isLegacy = steps === "over60" || (rpaTypes.includes("remote") && ["between30And60", "over60"].includes(steps));
  const isComplexBrowser = ["between30And60", "over60"].includes(steps) || ["ninePlus"].includes(state.rpa?.screens);
  let key = "browser_simple";
  let name = "Automatisierung über Weboberfläche";

  if (isLegacy) { key = "legacy"; name = "Legacy-/Remote-Automatisierung"; }
  else if (rpaTypes.includes("remote")) { key = "remote"; name = "Remote-/Citrix-Automatisierung"; }
  else if (rpaTypes.includes("desktop") || rpaTypes.includes("visual")) { key = "desktop"; name = "Desktop-Automatisierung"; }
  else if (isComplexBrowser) { key = "browser_complex"; name = "Komplexe Weboberflächen-Automatisierung"; }

  addUnique(modules, module(`rpa_${key}`, name, "rpa", RPA_MODULES[key].build, {
    publicLabel: name, replaces: ["automation_core"], standalone: true,
    discoveryRequired: key === "remote" || key === "legacy", complexityPoints: key === "legacy" ? 3 : 2
  }));

  if (rpaTypes.includes("visual")) {
    addUnique(modules, module("rpa_visual_detection", "Bildschirm- und Elementerkennung", "rpa", RPA_MODULES.visual.build, {
      publicLabel: "Visuelle Elementerkennung", standalone: true, complexityPoints: 2
    }));
  }
  return key;
}

function selectDatevModule(state, modules) {
  if (!state.systems?.includes("DATEV")) return;
  const scopes = state.datev?.scope?.length ? state.datev.scope : ["unclear"];
  const priority = ["bidirectional", "sync", "full", "accounting", "read", "documents", "file", "extf", "unclear"];
  const selected = priority.find((value) => scopes.includes(value)) || "unclear";
  const configKey = selected === "sync" ? "erp_sync" : selected;
  const labels = {
    extf: "DATEV-Datei / EXTF", file: "DATEV-Dateiaustausch", documents: "DATEV-Belegtransfer",
    accounting: "DATEV-Buchungsdaten", full: "DATEV-Buchungsdaten, Belege und Metadaten", read: "DATEV-Datenabruf",
    bidirectional: "Bidirektionale DATEV-Anbindung", erp_sync: "DATEV-System-Synchronisation", unclear: "DATEV-Anbindung"
  };
  addUnique(modules, module(`datev_${configKey}`, labels[configKey], "datev", DATEV_MODULES[configKey], {
    replaces: ["connector_DATEV", "finance_datev_export"], publicLabel: labels[configKey],
    complexityPoints: ["bidirectional", "erp_sync"].includes(configKey) ? 2 : 1,
    discoveryRequired: configKey === "unclear"
  }));
}

function selectConnectors(state, modules) {
  const systems = [...(state.systems || []), ...(state.customSystems || [])];
  const coveredGroups = new Set();
  for (const system of systems) {
    if (system === "DATEV") continue;
    const access = state.connections?.[system] || "unknown";
    if (RPA_ACCESS.has(access)) continue;

    let id = `connector_${system}`;
    let name = `${system}-Anbindung`;
    let range = INTEGRATION_MODULES.standardRestApi;
    let group = `system:${system}`;
    let points = access === "database" ? 1 : 0;

    if (access === "unknown") {
      range = INTEGRATION_MODULES.advancedApi;
      points = 1;
    } else if (access === "file") {
      if (["Excel", "Google Sheets"].includes(system)) continue;
      range = REAL_ESTATE_SYSTEMS.has(system) ? INTEGRATION_MODULES.xmlRealEstateFeed : INTEGRATION_MODULES.csvExcelImportExport;
    } else if (access === "database") {
      range = INTEGRATION_MODULES.sqlDatabase;
    } else if (MICROSOFT_SYSTEMS.has(system)) {
      id = "connector_microsoft"; group = "microsoft"; name = "Microsoft 365 / SharePoint"; range = INTEGRATION_MODULES.sharepointMicrosoftGraph;
    } else if (GOOGLE_SYSTEMS.has(system)) {
      id = "connector_google"; group = "google"; name = "Google Workspace"; range = INTEGRATION_MODULES.googleWorkspaceApi;
    } else if (CRM_SYSTEMS.has(system)) {
      id = system === "Salesforce" ? "connector_salesforce" : "connector_crm"; group = id;
      name = system === "Salesforce" ? "Salesforce-Anbindung" : "CRM-Anbindung";
      range = system === "Salesforce" ? INTEGRATION_MODULES.salesforceComplexCrm : INTEGRATION_MODULES.standardCrm;
    } else if (ERP_SYSTEMS.has(system)) {
      id = "connector_erp"; group = id; name = "ERP-Anbindung"; range = INTEGRATION_MODULES.erpApi;
    } else if (["SFTP", "FTP"].includes(system)) {
      id = "connector_file_transfer"; group = id; name = "Sicherer Dateiaustausch"; range = INTEGRATION_MODULES.sftpFtp;
    }

    if (coveredGroups.has(group)) continue;
    coveredGroups.add(group);
    addUnique(modules, module(id, name, "integration", range, { complexityPoints: points, system }));
  }
}

function selectDataModules(state, modules) {
  const operations = new Set(state.dataOperations || []);
  if (operations.has("transform") || operations.has("change")) addUnique(modules, module("data_transform", "Datentransformation", "data", DATA_MODULES.transformationNormalization));
  if (operations.has("validate")) addUnique(modules, module("data_validation", "Datenvalidierung", "data", DATA_MODULES.validationRules));
  if (operations.has("deduplicate")) addUnique(modules, module("data_deduplication", "Dublettenprüfung", "data", DATA_MODULES.deduplication));
  if (operations.has("master_data")) addUnique(modules, module("data_master", "Stammdatenabgleich", "data", DATA_MODULES.masterDataReconciliation));
  if (operations.has("multi_sync") || operations.has("bidirectional")) addUnique(modules, module("data_multi_mapping", "Systemübergreifender Datenabgleich", "data", DATA_MODULES.multiSystemMapping, { complexityPoints: 2 }));
  if (operations.has("sync") && !operations.has("multi_sync") && !operations.has("bidirectional")) addUnique(modules, module("data_mapping", "Automatischer Datenabgleich", "data", DATA_MODULES.complexMapping, { complexityPoints: 1 }));
  if (operations.has("migration")) addUnique(modules, module("data_migration", "Datenmigration", "data", DATA_MODULES.oneTimeMigration, { discoveryRequired: state.volume === "over_100000", complexityPoints: 2 }));
}

function selectDocumentModules(state, modules) {
  const docs = new Set(state.documents || []);
  const actions = new Set(state.documentActions || []);
  if (docs.has("none")) return;
  const hasScans = docs.has("scans") || docs.has("images") || state.dataComplexity === "ocr";
  const hasPdf = docs.has("pdfs") || docs.has("invoices") || docs.has("contracts") || docs.has("tenant") || docs.has("statements");
  const aiExtraction = actions.has("understand_ai") || (state.ai || []).some((item) => ["documents", "extract"].includes(item));

  if (aiExtraction) addUnique(modules, module("document_ai_extraction", "Intelligente Dokumentenverarbeitung", "document", DOCUMENT_MODULES.aiDocumentExtraction, { replaces: ["document_extract", "communication_attachments"], complexityPoints: 2 }));
  else if ((actions.has("read") || actions.has("extract")) && hasScans) addUnique(modules, module("document_ocr", "Erkennung gescannter Dokumente", "document", DOCUMENT_MODULES.ocrScans, { replaces: ["communication_attachments"], complexityPoints: 2 }));
  else if ((actions.has("read") || actions.has("extract")) && hasPdf) addUnique(modules, module("document_extract", "Strukturierte Dokumentenauslesung", "document", DOCUMENT_MODULES.structuredPdfExtraction, { replaces: ["communication_attachments"], complexityPoints: 1 }));

  if (actions.has("classify")) addUnique(modules, module("document_classification", "Dokumentenklassifikation", "document", DOCUMENT_MODULES.documentClassification));
  if (actions.has("create")) addUnique(modules, module("document_generation", "Dokumentenerstellung", "document", hasPdf ? DOCUMENT_MODULES.pdfTemplateGeneration : DOCUMENT_MODULES.wordExcelGeneration));
  if (actions.has("fill")) addUnique(modules, module("document_fill", "Dokumente automatisch befüllen", "document", DOCUMENT_MODULES.existingPdfFillManipulate));
  if (actions.has("merge") || actions.has("split")) addUnique(modules, module("document_merge", "Dokumente zusammenführen und aufteilen", "document", DOCUMENT_MODULES.pdfMergeSplitStamp));
  if (actions.has("sign")) addUnique(modules, module("document_signature", "Digitale Signatur", "document", DOCUMENT_MODULES.pandadocDocusign));
  const hasPrimaryDocumentWork = modules.some((item) => item.category === "document");
  if ((actions.has("store") || actions.has("rename") || actions.has("forward")) && !hasPrimaryDocumentWork) addUnique(modules, module("document_filing", "Dokumentenablage und Weiterleitung", "document", BUSINESS_MODULES.fileManagement));
}

function selectCommunicationModules(state, modules) {
  const actions = new Set(state.email?.actions || []);
  const channels = new Set(state.communication || []);
  const systems = new Set(state.systems || []);
  const needsMailbox = ["monitor", "save_attachments", "read_attachments", "classify", "recognize_customer", "start_process"].some((key) => actions.has(key)) ||
    systems.has("Outlook") || systems.has("Exchange") || systems.has("Gmail") || (state.documents || []).includes("emails");
  if (needsMailbox) {
    const mailboxRange = systems.has("Gmail") ? COMMUNICATION_MODULES.gmail : COMMUNICATION_MODULES.outlookM365Mailbox;
    addUnique(modules, module("communication_mailbox", "E-Mail- und Postfachverarbeitung", "communication", mailboxRange, {
      replaces: systems.has("Gmail") ? ["connector_google"] : ["connector_microsoft"]
    }));
  }
  if (["classify", "recognize_customer", "start_process"].some((key) => actions.has(key))) addUnique(modules, module("communication_routing", "E-Mail-Erkennung und Weiterleitung", "communication", COMMUNICATION_MODULES.emailClassificationRouting));
  if (["save_attachments", "read_attachments"].some((key) => actions.has(key))) addUnique(modules, module("communication_attachments", "Anhangsverarbeitung", "communication", COMMUNICATION_MODULES.attachmentProcessing));
  if (["auto_reply", "personalized"].some((key) => actions.has(key))) addUnique(modules, module("communication_email", "Automatisierte E-Mail-Kommunikation", "communication", COMMUNICATION_MODULES.transactionalEmail));
  if (actions.has("approval")) addUnique(modules, module("communication_approval", "Freigabe per E-Mail", "communication", COMMUNICATION_MODULES.emailApprovalWorkflow));
  if (actions.has("reminder") || actions.has("escalate")) addUnique(modules, module("communication_reminder", "Reminder und Eskalation", "communication", COMMUNICATION_MODULES.escalationReminder));
  if (channels.has("teams") || channels.has("slack")) addUnique(modules, module("communication_team", "Team-Benachrichtigungen", "communication", COMMUNICATION_MODULES.teamsSlackNotifications));
  if (channels.has("whatsapp")) addUnique(modules, module("communication_messaging", "WhatsApp-/SMS-Anbindung", "communication", COMMUNICATION_MODULES.smsWhatsAppProvider));
}

function selectAiModules(state, modules) {
  const ai = new Set(state.ai || []);
  if (ai.has("none")) return;
  if (ai.has("emails")) addUnique(modules, module("ai_email_triage", "KI-gestützte E-Mail-Analyse", "ai", AI_MODULES.emailTicketTriage, { replaces: ["business_customer_service", "communication_routing"], complexityPoints: 1 }));
  if (ai.has("extract") && !ai.has("documents")) addUnique(modules, module("ai_free_text", "KI-Datenextraktion", "ai", AI_MODULES.freeTextExtraction, { complexityPoints: 1 }));
  if (ai.has("classify")) addUnique(modules, module("ai_classification", "KI-Klassifikation", "ai", AI_MODULES.llmClassification, { replaces: ["document_classification"] }));
  if (ai.has("summarize")) addUnique(modules, module("ai_summary", "KI-Zusammenfassung", "ai", AI_MODULES.summarizationReporting));
  if (ai.has("write") || ai.has("draft")) addUnique(modules, module("ai_draft", "KI-Entwürfe mit Freigabe", "ai", AI_MODULES.aiDraftWithApproval, { replaces: ["ai_human_review"] }));
  if (ai.has("rag")) addUnique(modules, module("ai_knowledge", "KI mit Unternehmenswissen", "ai", AI_MODULES.ragInternalKnowledge, { standalone: true, complexityPoints: 2, discoveryRequired: true }));
  if (ai.has("agent")) addUnique(modules, module("ai_agent", "KI-Agent mit Systemaktionen", "ai", AI_MODULES.aiAgentToolActions, { standalone: true, complexityPoints: 3, discoveryRequired: true }));
  if (ai.has("voice")) {
    addUnique(modules, module("voice_assistant", "KI-Telefonassistent", "voice", VOICE_MODULES.basicAiPhoneAssistant, { standalone: true, complexityPoints: 2 }));
    addUnique(modules, module("voice_provider", "Telefonie-Anbindung", "voice", VOICE_MODULES.telephonyProviderIntegration));
  }
  if (state.approvals === "human_ai") addUnique(modules, module("ai_human_review", "Menschliche KI-Prüfung", "ai", AI_MODULES.humanInTheLoop));
}

function selectApprovalModules(state, modules) {
  if (!state.approvals || state.approvals === "none" || state.approvals === "human_ai") return;
  const complex = ["multi", "four_eyes", "amount", "departments"].includes(state.approvals);
  const range = complex ? DOCUMENT_MODULES.versionApprovalWorkflow : FINANCE_MODULES.approvalWorkflow;
  addUnique(modules, module("approval_workflow", complex ? "Mehrstufige Freigabelogik" : "Freigabelogik", "workflow", range, { complexityPoints: complex ? 2 : 1 }));
}

function selectProcessModules(state, modules) {
  const processes = new Set(state.processes || []);
  const detailedDocuments = (state.documentActions || []).length > 0;
  const detailedEmail = (state.email?.actions || []).length > 0;
  const aiEmail = (state.ai || []).includes("emails");
  const mappings = [
    ["incoming_invoices", "finance_incoming_invoice", "Eingangsrechnungsprozess", FINANCE_MODULES.incomingInvoiceWorkflow],
    ["outgoing_invoices", "finance_outgoing_invoice", "Automatisierte Rechnungserstellung", FINANCE_MODULES.invoiceGenerationApi],
    ["accounting", "finance_accounting", "Buchhaltungs- und Abgleichslogik", FINANCE_MODULES.paymentReconciliation],
    ["dunning", "finance_dunning", "Automatisiertes Mahnwesen", FINANCE_MODULES.dunningProcess],
    ["reporting", "business_reporting", "Automatisiertes Reporting", BUSINESS_MODULES.reporting],
    ["crm", "business_crm", "CRM- und Lead-Prozess", BUSINESS_MODULES.crmSales],
    ["hr", "business_hr", "HR-Prozessautomatisierung", BUSINESS_MODULES.hr],
    ["procurement", "business_procurement", "Bestell- und Lieferantenprozess", BUSINESS_MODULES.procurement],
    ["ecommerce", "business_ecommerce", "E-Commerce-Automatisierung", BUSINESS_MODULES.ecommerce],
    ["appointments", "business_calendar", "Terminprozess", BUSINESS_MODULES.calendar],
    ["customer_onboarding", "business_onboarding", "Kunden-Onboarding", AUDIT_MODULES.clientOnboarding],
    ["supplier_onboarding", "business_supplier", "Lieferanten-Onboarding", BUSINESS_MODULES.procurement],
    ["contracts", "business_contracts", "Vertragsprozess", DOCUMENT_MODULES.versionApprovalWorkflow],
    ["real_estate_management", "realestate_management", "Immobilien-Prozessautomatisierung", REAL_ESTATE_MODULES.portfolioReporting]
  ];
  mappings.forEach(([process, id, name, range]) => {
    const coveredInvoiceProcess = ["incoming_invoices", "outgoing_invoices"].includes(process) &&
      (detailedDocuments || detailedEmail || state.systems?.includes("DATEV"));
    if (processes.has(process) && !coveredInvoiceProcess) addUnique(modules, module(id, name, "business", range));
  });
  if (processes.has("document_processing") && !detailedDocuments) addUnique(modules, module("business_documents", "Dokumentenverarbeitung", "document", DOCUMENT_MODULES.documentClassification));
  if (processes.has("email_processes") && !detailedEmail) addUnique(modules, module("business_email", "E-Mail-Prozess", "communication", COMMUNICATION_MODULES.outlookM365Mailbox));
  if (processes.has("customer_service") && !aiEmail) addUnique(modules, module("business_customer_service", "Customer-Service-Automatisierung", "business", BUSINESS_MODULES.customerService));
  if (processes.has("voice") && !(state.ai || []).includes("voice")) addUnique(modules, module("voice_basic", "Telefon- und Anrufprozess", "voice", VOICE_MODULES.basicAiPhoneAssistant, { standalone: true }));
  if (processes.has("migration") && !(state.dataOperations || []).includes("migration")) addUnique(modules, module("data_migration", "Datenmigration", "data", DATA_MODULES.oneTimeMigration, { complexityPoints: 2 }));
}

function selectOperationalModules(state, modules) {
  if (["10000_100000", "over_100000"].includes(state.volume)) addUnique(modules, module("technical_queue", "Skalierbare Verarbeitung", "technical", TECHNICAL_MODULES.queueWorkerProcessing));
  if (state.volume === "over_100000") addUnique(modules, module("technical_large_data", "Verarbeitung großer Datenmengen", "technical", TECHNICAL_MODULES.largeDataImport, { complexityPoints: 1 }));
  if (state.criticality === "critical") {
    addUnique(modules, module("technical_error_queue", "Erweitertes Fehlermanagement", "technical", TECHNICAL_MODULES.advancedErrorQueue));
    addUnique(modules, module("security_audit", "Nachvollziehbarkeit und Protokollierung", "security", SECURITY_MODULES.auditLogging, { standalone: true }));
  }
}

function resolveModuleRules(modules) {
  const replacedIds = new Set(modules.flatMap((item) => item.replaces));
  const excludedIds = new Set(modules.flatMap((item) => item.excludes));
  return modules.filter((item, index, all) =>
    !replacedIds.has(item.id) && !excludedIds.has(item.id) && all.findIndex((candidate) => candidate.id === item.id) === index
  );
}

/** Selects customer-facing implementation areas and resolves technical overlap rules. */
export function buildSelectedModules(state) {
  const modules = [module("automation_core", "Automation Core", "core", AUTOMATION_CORE, { standalone: true })];
  const rpaKey = selectRpaModule(state, modules);
  selectDatevModule(state, modules);
  selectConnectors(state, modules);
  selectDataModules(state, modules);
  selectDocumentModules(state, modules);
  selectCommunicationModules(state, modules);
  selectAiModules(state, modules);
  selectApprovalModules(state, modules);
  selectProcessModules(state, modules);
  selectOperationalModules(state, modules);

  const hosting = HOSTING[state.hosting];
  if (hosting && state.hosting !== "unknown") addUnique(modules, module(`hosting_${state.hosting}`, "Einrichtung der technischen Umgebung", "hosting", hosting.setup, { standalone: true }));

  return { modules: resolveModuleRules(modules), rpaKey };
}

/** Scores the six technical dimensions without displaying internal scoring in the UI. */
export function calculateComplexity(state) {
  const accessValues = Object.values(state.connections || {});
  let access = 0;
  if (accessValues.some((value) => ["desktop", "remote", "visual"].includes(value))) access = 3;
  else if (accessValues.includes("browser")) access = 2;
  else if (accessValues.some((value) => ["file", "database", "unknown"].includes(value))) access = 1;

  const dataMap = { structured: 0, mixed: 1, unstructured: 2, ocr: 3, unknown: 1 };
  let data = dataMap[state.dataComplexity] ?? 0;
  if ((state.documents || []).some((value) => ["scans", "images"].includes(value))) data = Math.max(data, 3);
  else if ((state.documents || []).some((value) => ["pdfs", "contracts"].includes(value))) data = Math.max(data, 2);

  const branchMap = { linear: 0, some: 1, many: 2, stateful: 3, unknown: 1 };
  const exceptionMap = { rare: 0, some: 1, many: 2, unknown: 1 };
  let process = Math.max(branchMap[state.branches] ?? 0, exceptionMap[state.exceptions] ?? 0);
  if (state.rpa?.steps === "over60") process = 3;

  const auth = (state.rpa?.risks || []).includes("mfa") ? 2 : accessValues.includes("unknown") ? 1 : 0;
  const criticalityMap = { standard: 0, relevant: 1, business: 2, critical: 3 };
  const criticality = criticalityMap[state.criticality] ?? 0;
  const environmentMap = { yes: 0, partial: 1, production: 2, unknown: 1 };
  let environment = environmentMap[state.testEnvironment] ?? 0;
  if (accessValues.includes("remote")) environment = 3;

  let points = access + data + process + auth + criticality + environment;
  const orgaLegacy = state.systems?.includes("OrgaMAX Enterprise") && accessValues.some((value) => ["desktop", "remote"].includes(value));
  if (orgaLegacy && ["between30And60", "over60"].includes(state.rpa?.steps)) points = Math.max(points, 12);
  else if (orgaLegacy) points = Math.max(points, 8);
  points = Math.min(points, 18);

  let key = "low";
  if (points >= 12) key = "enterprise";
  else if (points >= 8) key = "high";
  else if (points >= 4) key = "medium";
  const risk = COMPLEXITY_RISK[key];
  return { level: key.toUpperCase(), publicLabel: risk.publicLabel, points, dimensions: { access, data, process, auth, criticality, environment } };
}

function calculateOverlapCompression(modules) {
  let relatedIndex = 0;
  let min = 0;
  let max = 0;
  const contributions = [];
  const minFactors = [0.75, 0.65, 0.55, 0.48, 0.45];
  const maxFactors = [0.6, 0.5, 0.42, 0.36, 0.33];
  for (const item of modules) {
    let minFactor = 1;
    let maxFactor = 1;
    if (!item.standalone && !["rpa", "security", "hosting"].includes(item.category)) {
      minFactor = minFactors[Math.min(relatedIndex, minFactors.length - 1)];
      maxFactor = maxFactors[Math.min(relatedIndex, maxFactors.length - 1)];
      relatedIndex += 1;
    }
    const contributionMin = roundTo(item.minPrice * minFactor, 50);
    const contributionMax = roundTo(item.maxPrice * maxFactor, 50);
    min += contributionMin;
    max += contributionMax;
    contributions.push({
      id: item.id,
      name: item.publicLabel,
      category: item.category,
      min: contributionMin,
      max: contributionMax,
      overlapAdjusted: minFactor < 1 || maxFactor < 1
    });
  }
  return { min, max, contributions };
}

function roundTo(value, increment = 100) {
  return Math.round(value / increment) * increment;
}

function getCombinedRisk(state, complexity) {
  const config = COMPLEXITY_RISK[complexity.level.toLowerCase()];
  const baseMin = config.uplift?.min ?? 0.55;
  const baseMax = config.uplift?.max ?? 0.7;
  const risks = new Set(state.rpa?.risks || []);
  let rpaSignal = 0;
  if (risks.has("slow") || risks.has("remote")) rpaSignal += 0.2;
  if (risks.has("dialogs")) rpaSignal += 0.12;
  if (risks.has("resolutions")) rpaSignal += 0.1;
  if (risks.has("no_test")) rpaSignal += 0.2;
  if (risks.has("no_fallback")) rpaSignal += 0.18;
  return { min: Math.min(0.7, Math.max(baseMin, rpaSignal * 0.65)), max: Math.min(0.7, Math.max(baseMax, rpaSignal)) };
}

function selectBudgetBand(min, max) {
  if (max > 50000) return { min: Math.max(50000, Math.floor(min / 5000) * 5000), max: null, type: "from", label: "ab 50.000 €" };
  const targetMid = (min + max) / 2;
  let best = PUBLIC_BUDGET_BANDS[0];
  let bestScore = Number.POSITIVE_INFINITY;
  for (const band of PUBLIC_BUDGET_BANDS) {
    const bandMid = (band[0] + band[1]) / 2;
    const missesLow = Math.max(0, band[0] - min);
    const missesHigh = Math.max(0, max - band[1]);
    const score = Math.abs(bandMid - targetMid) + missesLow * 0.35 + missesHigh * 0.35;
    if (score < bestScore) { best = band; bestScore = score; }
  }
  return { min: best[0], max: best[1], type: "range", label: `${formatNumber(best[0])}–${formatCurrency(best[1])}` };
}

function determineFloor(state, rpaKey, complexity) {
  if (complexity.level === "ENTERPRISE") return PROJECT_FLOORS.enterprise;
  if (rpaKey === "legacy") return PROJECT_FLOORS.legacy;
  if (rpaKey === "remote") return PROJECT_FLOORS.remote;
  if (rpaKey === "desktop" || rpaKey === "visual") return PROJECT_FLOORS.desktop;
  if (rpaKey?.startsWith("browser")) return PROJECT_FLOORS.browser;
  return PROJECT_FLOORS.standard;
}

function determineDiscovery(state, complexity, modules, rpaKey) {
  const connections = Object.values(state.connections || {});
  const migration = (state.dataOperations || []).includes("migration") || (state.processes || []).includes("migration");
  const required = complexity.points >= 8 || modules.some((item) => item.discoveryRequired) || rpaKey === "remote" || rpaKey === "legacy" ||
    state.testEnvironment === "production" || (migration && ["over_100000", "unknown"].includes(state.volume)) ||
    (connections.includes("unknown") && ["business", "critical"].includes(state.criticality)) || state.rpa?.steps === "over60";
  if (!required) return { required: false, type: null, label: null, range: null };
  const rpa = Boolean(rpaKey);
  return {
    required: true,
    type: rpa ? "rpa" : "technical",
    label: rpa ? "RPA-/Legacy-Feasibility" : "Technical Discovery",
    range: rpa ? { min: DISCOVERY.rpa.min, max: DISCOVERY.rpa.max } : { min: DISCOVERY.technical.min, max: DISCOVERY.technical.max }
  };
}

export function formatCurrency(value) {
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(value)} €`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(value);
}

/** Calculates a non-binding range from centrally configured modules. */
export function calculateEstimate(state) {
  const complexity = calculateComplexity(state);
  const selected = buildSelectedModules(state);
  const compressed = calculateOverlapCompression(selected.modules);
  const risk = getCombinedRisk(state, complexity);
  const floor = determineFloor(state, selected.rpaKey, complexity);
  const afterRiskMin = compressed.min * (1 + risk.min);
  const afterRiskMax = compressed.max * (1 + risk.max);
  let rawMin = Math.max(floor, afterRiskMin);
  let rawMax = Math.max(floor * 1.25, afterRiskMax);

  const hasUnknown = Object.values(state.connections || {}).includes("unknown") || state.dataComplexity === "unknown" || (state.ai || []).includes("unknown");
  const uncertaintyMax = hasUnknown ? rawMax * 0.12 : 0;
  if (hasUnknown) rawMax += uncertaintyMax;

  const orgaLegacy = state.systems?.includes("OrgaMAX Enterprise") && Object.values(state.connections || {}).some((value) => ["desktop", "remote"].includes(value));
  let budget = orgaLegacy ? { min: 15000, max: 25000, type: "range", label: "15.000–25.000 €+", plus: true } : selectBudgetBand(rawMin, rawMax);
  if (complexity.level === "ENTERPRISE" && budget.max && budget.min < 15000) budget = { min: 15000, max: 25000, type: "range", label: "15.000–25.000 €+", plus: true };

  const discovery = determineDiscovery(state, complexity, selected.modules, selected.rpaKey);
  const care = recommendCare(state, complexity);
  const hosting = recommendHosting(state);
  const result = {
    version: "1.0", budget, complexity, care, hosting, discovery,
    modules: selected.modules.filter((item) => !item.internalOnly).map(({ id, publicLabel, category }) => ({ id, name: publicLabel, category })),
    breakdown: {
      items: compressed.contributions,
      subtotal: { min: compressed.min, max: compressed.max },
      risk: {
        minPercent: Math.round(risk.min * 100),
        maxPercent: Math.round(risk.max * 100),
        minAmount: roundTo(compressed.min * risk.min),
        maxAmount: roundTo(compressed.max * risk.max)
      },
      uncertainty: hasUnknown ? { maxPercent: 12, maxAmount: roundTo(uncertaintyMax) } : null,
      floor: {
        value: floor,
        appliedMin: floor > afterRiskMin,
        appliedMax: floor * 1.25 > afterRiskMax
      },
      calculated: { min: roundTo(rawMin), max: roundTo(rawMax) },
      publicBudget: { ...budget }
    },
    diagnostics: { rawMin: Math.round(rawMin), rawMax: Math.round(rawMax), floor, risk, rpaKey: selected.rpaKey },
    externalCostsNotice: "Drittanbieter-, Lizenz- und nutzungsabhängige Kosten sind nicht Bestandteil der Budgetindikation, sofern nicht ausdrücklich angegeben."
  };
  return result;
}

export class LocalPricingProvider {
  async requestEstimate(configuration) { return calculateEstimate(configuration); }
}

export class RemotePricingProvider {
  constructor(endpoint) { this.endpoint = endpoint; }
  async requestEstimate(configuration) {
    const response = await fetch(this.endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(configuration)
    });
    if (!response.ok) throw new Error("Budgetberechnung konnte nicht geladen werden.");
    return response.json();
  }
}

export async function requestEstimate(configuration, provider = new LocalPricingProvider()) {
  return provider.requestEstimate(configuration);
}
