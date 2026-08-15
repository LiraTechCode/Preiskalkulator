const option = (id, label, description = "") => Object.freeze({ id, label, description });

export const INDUSTRIES = Object.freeze([
  option("real_estate", "Immobilien"), option("audit", "Wirtschaftsprüfung"), option("tax", "Steuerberatung"),
  option("finance", "Finance"), option("retail", "Handel"), option("ecommerce", "E-Commerce"),
  option("services", "Dienstleistung"), option("industry", "Industrie"), option("craft", "Handwerk"),
  option("it", "IT"), option("health", "Gesundheitswesen"), option("other", "Sonstige")
]);

export const PROCESSES = Object.freeze([
  option("incoming_invoices", "Eingangsrechnungen"), option("outgoing_invoices", "Ausgangsrechnungen"),
  option("accounting", "Buchhaltung"), option("dunning", "Mahnwesen"), option("real_estate_management", "Immobilienverwaltung"),
  option("document_processing", "Dokumentenverarbeitung"), option("email_processes", "E-Mail-Prozesse"),
  option("reporting", "Reporting"), option("crm", "CRM / Lead Management"), option("data_sync", "Datensynchronisation"),
  option("hr", "HR / Personal"), option("customer_onboarding", "Kunden-Onboarding"),
  option("supplier_onboarding", "Lieferanten-Onboarding"), option("contracts", "Vertragsmanagement"),
  option("approvals", "Freigabeprozesse"), option("migration", "Datenmigration"), option("customer_service", "Customer Service"),
  option("appointments", "Terminplanung"), option("procurement", "Bestellungen / Procurement"),
  option("ecommerce", "E-Commerce"), option("voice", "Telefon / Kundenanfragen"), option("custom", "Individueller Prozess")
]);

export const SYSTEM_GROUPS = Object.freeze([
  { label: "Finance / ERP", options: ["DATEV", "SAP", "Microsoft Dynamics", "OrgaMAX", "OrgaMAX Enterprise", "Lexware", "sevDesk", "Xero", "individuelles ERP"] },
  { label: "Immobilien", options: ["Immoware24", "casavi", "DOMUS", "PowerHaus", "Wodis Sigma", "Haufe", "EverReal", "ImmobilienScout24", "Immowelt", "eigenes Immobilienportal"] },
  { label: "Microsoft", options: ["Outlook", "Exchange", "Microsoft 365", "Microsoft Graph", "SharePoint", "OneDrive", "Excel", "Teams"] },
  { label: "CRM", options: ["HubSpot", "Salesforce", "Pipedrive", "Zoho", "individuelles CRM"] },
  { label: "Google", options: ["Gmail", "Google Drive", "Google Sheets", "Google Calendar", "Google Workspace"] },
  { label: "Automation / Weitere", options: ["n8n", "Slack", "WhatsApp", "Stripe", "Shopify", "Notion", "Datenbank", "Website", "REST API", "SFTP", "FTP", "Cloud Storage", "eigener Server", "anderes System"] }
].map((group) => Object.freeze({ ...group, options: Object.freeze(group.options.map((label) => option(label, label))) })));

export const ACCESS_OPTIONS = Object.freeze([
  option("api", "Direkte Schnittstelle / API", "Das System bietet eine technische Schnittstelle."),
  option("file", "Datei-Austausch", "Daten werden als Excel, CSV, XML oder ähnliche Datei ausgetauscht."),
  option("database", "Datenbank", "Direkter Zugriff auf die Datenbank ist möglich."),
  option("browser", "Browser", "Der Prozess wird über eine Website bedient."),
  option("desktop", "Desktop-Programm", "Das Programm läuft lokal auf einem Computer."),
  option("remote", "Remote Desktop / Citrix", "Das Programm läuft in einer entfernten Arbeitsumgebung."),
  option("visual", "Bildschirm-/Bilderkennung", "Elemente müssen anhand ihrer Darstellung erkannt werden."),
  option("unknown", "Weiß ich nicht", "LiraTech prüft die technische Anbindung.")
]);

export const DATA_OPERATIONS = Object.freeze([
  option("read", "Daten abrufen"), option("write", "Daten übertragen"), option("change", "Daten verändern"),
  option("validate", "Daten validieren"), option("transform", "Daten transformieren"), option("deduplicate", "Dubletten entfernen"),
  option("master_data", "Stammdaten abgleichen"), option("sync", "Zwei Systeme synchronisieren"),
  option("multi_sync", "Mehrere Systeme synchronisieren"), option("bidirectional", "Bidirektional synchronisieren"),
  option("migration", "Bestehende Daten migrieren")
]);

export const DATA_COMPLEXITY = Object.freeze([
  option("structured", "Überwiegend strukturiert", "Klare Felder, Tabellen oder einheitliche Formate."),
  option("mixed", "Mehrere Formate", "Unterschiedliche Tabellen, Exporte oder Datenmodelle."),
  option("unstructured", "PDF / Freitext", "Inhalte liegen teilweise unstrukturiert vor."),
  option("ocr", "Scans / uneinheitlich", "Dokumente erfordern Erkennung oder variieren stark."),
  option("unknown", "Weiß ich nicht", "Wir prüfen Datenqualität und Formate gemeinsam.")
]);

export const DOCUMENTS = Object.freeze([
  option("emails", "E-Mails"), option("pdfs", "PDFs"), option("invoices", "Rechnungen"), option("contracts", "Verträge"),
  option("scans", "Scans"), option("images", "Bilder"), option("excel", "Excel"), option("word", "Word"),
  option("forms", "Formulare"), option("tenant", "Mieterdokumente"), option("statements", "Kontoauszüge"),
  option("other", "Sonstige Dateien"), option("none", "Keine Dokumente")
]);

export const DOCUMENT_ACTIONS = Object.freeze([
  option("read", "Auslesen"), option("create", "Erstellen"), option("fill", "Befüllen"), option("classify", "Klassifizieren"),
  option("rename", "Umbenennen"), option("store", "Ablegen"), option("merge", "Zusammenführen"), option("split", "Trennen"),
  option("sign", "Unterschreiben lassen"), option("forward", "Weiterleiten"), option("extract", "Daten extrahieren"),
  option("understand_ai", "Mit KI verstehen")
]);

export const EMAIL_ACTIONS = Object.freeze([
  option("monitor", "Postfach überwachen"), option("save_attachments", "Anhänge speichern"),
  option("read_attachments", "Anhänge auslesen"), option("classify", "E-Mail klassifizieren"),
  option("recognize_customer", "Kundendaten erkennen"), option("start_process", "Vorgang starten"),
  option("auto_reply", "Automatisch antworten"), option("draft_reply", "Antwort vorbereiten"),
  option("personalized", "Personalisierte E-Mail versenden"), option("reminder", "Reminder versenden"),
  option("escalate", "Eskalation auslösen"), option("approval", "Freigabe per E-Mail")
]);

export const COMMUNICATION = Object.freeze([
  option("email", "E-Mail"), option("teams", "Microsoft Teams"), option("slack", "Slack"),
  option("whatsapp", "WhatsApp / SMS"), option("none", "Keine weitere Kommunikation")
]);

export const AI_OPTIONS = Object.freeze([
  option("none", "Nein"), option("documents", "Dokumente verstehen"), option("extract", "Daten extrahieren"),
  option("emails", "E-Mails analysieren"), option("write", "Texte erstellen"), option("classify", "Klassifizieren"),
  option("summarize", "Zusammenfassen"), option("draft", "Antworten vorbereiten"),
  option("rag", "Wissensdatenbank / Unternehmenswissen"), option("agent", "AI Agent"),
  option("voice", "Telefonassistent"), option("unknown", "Noch unklar")
]);

export const APPROVALS = Object.freeze([
  option("none", "Nein"), option("one", "Eine Freigabe"), option("multi", "Mehrstufige Freigabe"),
  option("four_eyes", "Vier-Augen-Prinzip"), option("amount", "Betragsabhängige Freigabe"),
  option("departments", "Mehrere Abteilungen"), option("human_ai", "Mensch prüft KI-Ergebnis")
]);

export const BRANCHES = Object.freeze([
  option("linear", "Fast immer gleich"), option("some", "Einige unterschiedliche Fälle"),
  option("many", "Viele Sonderfälle"), option("stateful", "Sehr komplex / stark zustandsabhängig"),
  option("unknown", "Weiß ich nicht")
]);

export const EXCEPTIONS = Object.freeze([
  option("rare", "Selten und einfach lösbar"), option("some", "Regelmäßig, aber bekannt"),
  option("many", "Viele unterschiedliche Ausnahmen"), option("unknown", "Weiß ich nicht")
]);

export const VOLUMES = Object.freeze([
  option("under_100", "Unter 100 Vorgänge / Monat"), option("100_1000", "100–1.000"),
  option("1000_10000", "1.000–10.000"), option("10000_100000", "10.000–100.000"),
  option("over_100000", "Über 100.000"), option("unknown", "Unbekannt")
]);

export const CRITICALITIES = Object.freeze([
  option("standard", "Standard", "Der Vorgang kann später manuell korrigiert werden."),
  option("relevant", "Relevant", "Ein Mitarbeiter sollte informiert werden."),
  option("business", "Geschäftskritisch", "Rechnungen, Zahlungen, Fristen oder Kundenprozesse können betroffen sein."),
  option("critical", "Hochkritisch", "Ein Ausfall muss unmittelbar erkannt und behandelt werden.")
]);

export const TEST_ENVIRONMENTS = Object.freeze([
  option("yes", "Ja"), option("partial", "Teilweise"), option("production", "Nur Produktionssystem"), option("unknown", "Weiß ich nicht")
]);

export const HOSTING_OPTIONS = Object.freeze([
  option("existing", "Bestehende Infrastruktur"), option("saas", "n8n Cloud / bestehende SaaS-Plattform"),
  option("managed", "LiraTech Managed Cloud"), option("on_premise", "On-Premise"),
  option("windows_runner", "Windows/RPA Runner"), option("remote_environment", "Remote/Citrix Umgebung"),
  option("unknown", "Noch offen")
]);

export const DATEV_OPTIONS = Object.freeze([
  option("extf", "DATEV-Datei / EXTF erzeugen"), option("file", "DATEV-Dateien importieren/exportieren"),
  option("documents", "Belege übertragen"), option("accounting", "Buchungsdaten übertragen"),
  option("full", "Buchungsdaten + Belege + Metadaten"), option("read", "Daten aus DATEV abrufen"),
  option("sync", "DATEV mit anderem System synchronisieren"), option("bidirectional", "Bidirektional synchronisieren"),
  option("multiple_clients", "Mehrere Mandanten"), option("unclear", "Noch unklar")
]);

export const RPA_STEPS = Object.freeze([
  option("under10", "Unter 10"), option("between10And30", "10–30"), option("between30And60", "30–60"),
  option("over60", "Mehr als 60"), option("unknown", "Unbekannt")
]);

export const RPA_SCREENS = Object.freeze([
  option("oneToThree", "1–3"), option("fourToEight", "4–8"), option("ninePlus", "9 oder mehr"), option("unknown", "Unbekannt")
]);

export const RPA_RISKS = Object.freeze([
  option("remote", "Remote Desktop / Citrix"), option("slow", "Langsame oder schwankende Ladezeiten"),
  option("dialogs", "Viele Dialogfenster"), option("uploads", "Datei-Uploads"), option("downloads", "Datei-Downloads"),
  option("accounts", "Mehrere Nutzerkonten"), option("clients", "Mehrere Mandanten"), option("mfa", "MFA / zusätzliche Anmeldung"),
  option("approvals", "Manuelle Freigaben"), option("resolutions", "Unterschiedliche Bildschirmgrößen"),
  option("no_test", "Keine Testumgebung"), option("no_fallback", "Kein manuelles Fallback"), option("unknown", "Weiß ich nicht")
]);

export function getOptionLabel(collection, id) {
  return collection.find((item) => item.id === id)?.label || id || "Nicht angegeben";
}

export function getSystemLabels() {
  return SYSTEM_GROUPS.flatMap((group) => group.options.map((item) => item.label));
}
