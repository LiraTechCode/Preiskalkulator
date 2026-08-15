const publicRange = (min, max) => Object.freeze({ min, max, visibility: "public", enabled: true });
const internalRange = (min, max) => Object.freeze({ min, max, visibility: "internal", enabled: true });

export const ACCESS_CLASSES = Object.freeze({
  api: { code: "A", factorMin: 1, factorMax: 1 },
  file: { code: "B", factorMin: 1, factorMax: 1.2 },
  database: { code: "C", factorMin: 1.1, factorMax: 1.4 },
  browser: { code: "D", factorMin: 1.5, factorMax: 2.2 },
  desktop: { code: "E", factorMin: 2, factorMax: 3 },
  remote: { code: "F", factorMin: 2.5, factorMax: 4 },
  visual: { code: "G", factorMin: 3, factorMax: 5 },
  unknown: { code: "?", factorMin: 1, factorMax: 1.25 }
});

export const INTEGRATION_MODULES = Object.freeze({
  standardRestApi: publicRange(1200, 2500), advancedApi: publicRange(2500, 5000),
  oauth2ComplexAuth: publicRange(750, 1750), webhook: publicRange(1000, 2500),
  paginationRateLimitDeltaSync: publicRange(1000, 3000), customApiClientMiddleware: publicRange(3000, 7500),
  csvExcelImportExport: publicRange(900, 2500), xmlRealEstateFeed: publicRange(1500, 3500),
  sftpFtp: publicRange(1000, 2500), sqlDatabase: publicRange(1500, 4000),
  sharepointMicrosoftGraph: publicRange(2000, 5000), googleWorkspaceApi: publicRange(1500, 4000),
  standardCrm: publicRange(1500, 4500), salesforceComplexCrm: publicRange(3000, 8000),
  erpApi: publicRange(2500, 7500), poorlyDocumentedApiRisk: internalRange(0.2, 0.5)
});

export const DATA_MODULES = Object.freeze({
  simpleMapping: publicRange(750, 1500), complexMapping: publicRange(1500, 4000),
  transformationNormalization: publicRange(1500, 4000), deduplication: publicRange(1000, 2500),
  validationRules: publicRange(1000, 3000), masterDataReconciliation: publicRange(2000, 5000),
  multiSystemMapping: publicRange(3000, 7500), oneTimeMigration: publicRange(2500, 10000)
});

export const DATA_OPERATION_FACTORS = Object.freeze({
  read: 1, write: 1.1, read_write: 1.2, sync: 1.35, multi_sync: 1.5, bidirectional: 1.7
});

export const DATEV_MODULES = Object.freeze({
  extf: publicRange(1500, 2500), file: publicRange(2000, 4000), documents: publicRange(2500, 4500),
  accounting: publicRange(4000, 7500), full: publicRange(5000, 9000), read: publicRange(4000, 8000),
  bidirectional: publicRange(7500, 15000), erp_sync: publicRange(10000, 20000),
  unclear: publicRange(2000, 8000)
});

export const RPA_MODULES = Object.freeze({
  browser_simple: { build: publicRange(4500, 7000), recommendedCareFrom: 399 },
  browser_complex: { build: publicRange(7000, 12000), recommendedCareFrom: 599 },
  desktop: { build: publicRange(6500, 12500), recommendedCareFrom: 599 },
  remote: { build: publicRange(9900, 18000), recommendedCareFrom: 899 },
  legacy: { build: publicRange(12500, 25000), plus: true, recommendedCareFrom: 1290 },
  additionalProcess: { build: publicRange(3500, 10000), monthly: publicRange(199, 499) },
  visual: { build: publicRange(2500, 7500), monthly: publicRange(100, 300) }
});

export const RPA_RISK = Object.freeze({
  unstableUi: internalRange(0.2, 0.4), rdpCitrixLatency: internalRange(0.25, 0.6),
  modalDialogsPopups: internalRange(0.15, 0.35), timeCriticalWindows: internalRange(0.15, 0.3),
  multipleScreenResolutions: internalRange(0.1, 0.25), noTestEnvironment: internalRange(0.2, 0.5),
  criticalNoFallback: internalRange(0.25, 0.5), automaticCap: 0.7
});

export const RPA_CLICK_DIAGNOSTICS = Object.freeze({
  under10: publicRange(0, 0), between10And30: publicRange(1500, 3000),
  between30And60: publicRange(3000, 6000), over60: null, unknown: null
});

export const RPA_SCREEN_DIAGNOSTICS = Object.freeze({
  oneToThree: publicRange(0, 0), fourToEight: publicRange(1500, 3000), ninePlus: publicRange(3000, 6000), unknown: null
});

export const COMMUNICATION_MODULES = Object.freeze({
  transactionalEmail: publicRange(900, 1800), htmlTemplatesPersonalization: publicRange(750, 2000),
  outlookM365Mailbox: publicRange(1500, 3500), sharedMailboxProcessing: publicRange(1500, 3500),
  gmail: publicRange(1200, 3000), emailClassificationRouting: publicRange(1500, 4000),
  attachmentProcessing: publicRange(1500, 3500), emailApprovalWorkflow: publicRange(1500, 3500),
  teamsSlackNotifications: publicRange(800, 2000), smsWhatsAppProvider: publicRange(1500, 4000),
  escalationReminder: publicRange(1000, 3000)
});

export const DOCUMENT_MODULES = Object.freeze({
  pdfTemplateGeneration: publicRange(1500, 3000), existingPdfFillManipulate: publicRange(2000, 4500),
  pdfMergeSplitStamp: publicRange(1000, 2500), wordExcelGeneration: publicRange(1500, 3500),
  structuredPdfExtraction: publicRange(2000, 4500), ocrScans: publicRange(2500, 5500),
  aiDocumentExtraction: publicRange(3500, 7500), documentClassification: publicRange(2000, 5000),
  pandadocDocusign: publicRange(1500, 3500), documentPackagesZipStructure: publicRange(1500, 3000),
  versionApprovalWorkflow: publicRange(2000, 5000)
});

export const AI_MODULES = Object.freeze({
  llmClassification: publicRange(1500, 3500), emailTicketTriage: publicRange(2000, 4500),
  freeTextExtraction: publicRange(2500, 5000), summarizationReporting: publicRange(2000, 4500),
  aiDraftWithApproval: publicRange(2500, 5500), ragInternalKnowledge: publicRange(5000, 12000),
  aiAgentToolActions: publicRange(6000, 15000), humanInTheLoop: publicRange(1500, 4000),
  promptOutputGuardrails: publicRange(1500, 4000), aiEvaluationTestset: publicRange(2000, 5000)
});

export const VOICE_MODULES = Object.freeze({
  telephonyProviderIntegration: publicRange(1500, 4000), basicAiPhoneAssistant: publicRange(4000, 7500),
  appointmentVoiceAssistant: publicRange(5000, 10000), crmConnectedVoiceAssistant: publicRange(7500, 15000),
  complexInboundOutboundVoiceAutomation: publicRange(10000, 20000), callTranscriptionSummary: publicRange(2000, 5000)
});

export const FINANCE_MODULES = Object.freeze({
  invoiceDataValidation: publicRange(2000, 5000), invoiceGenerationApi: publicRange(2500, 6000),
  incomingInvoiceWorkflow: publicRange(3000, 7500), approvalWorkflow: publicRange(2000, 5000),
  dunningProcess: publicRange(3000, 7500), paymentReconciliation: publicRange(3500, 8000),
  datevTaxAdvisorExport: publicRange(2000, 5000), erpConnectorApi: publicRange(2500, 7500),
  bankTransactionProvider: publicRange(3000, 7500)
});

export const REAL_ESTATE_MODULES = Object.freeze({
  portalLeadToCrm: publicRange(2500, 5000), leadRoutingBrokerAssignment: publicRange(2000, 4500),
  portalSyncApiXml: publicRange(3000, 7500), portalBrowserRpa: publicRange(5000, 10000),
  exposeDocumentPackage: publicRange(2500, 5500), selfDisclosurePdfESign: publicRange(3500, 7500),
  propertyCustomerMatching: publicRange(4000, 10000), financingPrecheckRules: publicRange(3000, 7500),
  tenantMasterDataExportMapping: publicRange(2500, 6000), dunningReceivables: publicRange(4000, 10000),
  damageTicketTriage: publicRange(3000, 7500), portfolioReporting: publicRange(3000, 8000),
  dmsRouting: publicRange(2500, 6500)
});

export const AUDIT_MODULES = Object.freeze({
  clientOnboarding: publicRange(3000, 7000), pbcDocumentRequestReminder: publicRange(3500, 7500),
  emailAttachmentAssignment: publicRange(2500, 6000), documentClassification: publicRange(3000, 7500),
  excelCsvConsolidation: publicRange(2000, 5000), plausibilityRuleChecks: publicRange(3000, 8000),
  samplingDataPreparation: publicRange(2500, 6000), reconciliationFlow: publicRange(3500, 9000),
  reportWorkingPaperGeneration: publicRange(3000, 7000), fourEyesApproval: publicRange(2500, 6000),
  auditTrailLogs: publicRange(2500, 6500)
});

export const BUSINESS_MODULES = Object.freeze({
  crmSales: publicRange(2000, 7500), customerService: publicRange(2500, 8000), hr: publicRange(2500, 7500),
  procurement: publicRange(3000, 8000), ecommerce: publicRange(3000, 10000), reporting: publicRange(2000, 6000),
  calendar: publicRange(1500, 4500), fileManagement: publicRange(1500, 5000), dataQuality: publicRange(2500, 7000),
  monitoringBusinessAlerts: publicRange(1500, 4500), publicWebData: publicRange(2500, 7500), approvalPortal: publicRange(4000, 10000)
});

export const TECHNICAL_MODULES = Object.freeze({
  scheduledBatchProcessing: publicRange(750, 2000), queueWorkerProcessing: publicRange(1500, 4000),
  customDatabaseSchema: publicRange(2000, 5000), customApiEndpoint: publicRange(2000, 5000),
  dashboardFrontend: publicRange(3500, 9000), webFormIntake: publicRange(1500, 3500),
  advancedErrorQueue: publicRange(1500, 4000), reconciliationMonitoring: publicRange(2000, 5000),
  largeDataImport: publicRange(2000, 6000)
});

export const SECURITY_MODULES = Object.freeze({
  secretsCredentialManagement: publicRange(1000, 2500), workflowRolesAccess: publicRange(1500, 4000),
  auditLogging: publicRange(1500, 4500), euHostingDataResidency: publicRange(1500, 4000),
  retentionDeletionLogic: publicRange(1500, 4000), pseudonymizationDataMinimization: publicRange(1500, 4500),
  ssoSamlAutomationPlatform: publicRange(2500, 6000), devTestProdSeparation: publicRange(2000, 5000),
  backupRestoreConcept: publicRange(1500, 3500), selfHostedSecurityHardening: publicRange(2500, 6000)
});

export const AUTOMATION_CORE = Object.freeze({ min: 2900, max: 4500, visibility: "public", enabled: true });

export const DISCOVERY = Object.freeze({
  quickCheck: publicRange(450, 750), technical: publicRange(900, 1800),
  rpa: publicRange(1500, 3500), proofOfConcept: publicRange(1500, 4000),
  onsiteProcessAnalysisPerDay: 1200
});

export const HOSTING = Object.freeze({
  existing: { name: "Bestehende Infrastruktur", setup: publicRange(750, 2000), monthly: publicRange(0, 199) },
  saas: { name: "Bestehende Cloud-/SaaS-Plattform", setup: publicRange(750, 1500), monthly: null },
  managed: { name: "LiraTech Managed Cloud", setup: publicRange(2500, 5500), monthly: publicRange(249, 599) },
  on_premise: { name: "On-Premise-Infrastruktur", setup: publicRange(5000, 10000), monthly: publicRange(599, 1490) },
  windows_runner: { name: "Windows/RPA Runner", setup: publicRange(1500, 4000), monthly: publicRange(199, 499) },
  remote_environment: { name: "Remote-/Citrix-Bot-Umgebung", setup: publicRange(2500, 6000), monthly: publicRange(299, 699) },
  unknown: { name: "Technische Infrastruktur noch offen", setup: publicRange(0, 0), monthly: null }
});

export const CARE = Object.freeze({
  essential: { name: "Care Essential", monthly: 249, workflows: 3, supportHours: 1 },
  business: { name: "Care Business", monthly: 599, workflows: 10, supportHours: 3 },
  critical: { name: "Care Critical", monthly: 1290, workflows: 25, supportHours: 8 },
  managedPlus: { name: "Managed Automation Plus", monthlyFrom: 1990 }
});

export const RPA_CARE = Object.freeze({
  browser: publicRange(199, 399), desktop: publicRange(299, 599), remote: publicRange(499, 990)
});

export const INTERNAL_RATES = Object.freeze({
  buildMin: 135, buildMax: 150, adHocSupport: 165, criticalOutOfHours: 190, visibility: "internal"
});

export const COMPLEXITY_RISK = Object.freeze({
  low: { from: 0, to: 3, uplift: internalRange(0.1, 0.15), publicLabel: "Standard" },
  medium: { from: 4, to: 7, uplift: internalRange(0.2, 0.35), publicLabel: "Mittel" },
  high: { from: 8, to: 11, uplift: internalRange(0.4, 0.7), publicLabel: "Komplex", discoveryRequired: true },
  enterprise: { from: 12, to: 18, publicLabel: "Enterprise", customPricing: true, discoveryRequired: true }
});

export const PROJECT_FLOORS = Object.freeze({
  standard: 2900, browser: 7500, desktop: 9000, remote: 12000, legacy: 15000, enterprise: 15000
});

export const PUBLIC_BUDGET_BANDS = Object.freeze([
  [2900, 4500], [4000, 6000], [5000, 7500], [6500, 9000], [7500, 10000], [8000, 12000],
  [10000, 15000], [12000, 18000], [15000, 25000], [20000, 30000], [25000, 40000], [30000, 50000]
]);

export const INTERNAL_SALES_RULES = Object.freeze({
  paymentPlanStandard: [0.4, 0.4, 0.2], paymentPlanLargeProject: [0.3, 0.3, 0.3, 0.1],
  largeProjectThreshold: 20000, expressUplift: [0.2, 0.3], expectedRiskBuffer: [0.1, 0.7],
  valueGuardrailAnnualBenefit: [0.1, 0.2], visibility: "internal"
});

export const VALUE_GUARDRAIL = Object.freeze({ enabled: false, visibility: "internal" });

export const PRICING = Object.freeze({
  version: "1.0", integrations: INTEGRATION_MODULES, data: DATA_MODULES, datev: DATEV_MODULES,
  rpa: RPA_MODULES, communication: COMMUNICATION_MODULES, documents: DOCUMENT_MODULES,
  ai: AI_MODULES, voice: VOICE_MODULES, finance: FINANCE_MODULES, realEstate: REAL_ESTATE_MODULES,
  audit: AUDIT_MODULES, business: BUSINESS_MODULES, technical: TECHNICAL_MODULES,
  security: SECURITY_MODULES, core: AUTOMATION_CORE, discovery: DISCOVERY, hosting: HOSTING,
  care: CARE, floors: PROJECT_FLOORS, budgetBands: PUBLIC_BUDGET_BANDS
});
