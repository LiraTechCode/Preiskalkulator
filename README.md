# LiraTech Website & Automation Budget Calculator

Statische LiraTech-Website mit einem vollständig clientseitigen, responsiven Budget-Rechner für individuelle Prozessautomatisierungen. Es gibt keinen Build-Schritt und keine Framework-Abhängigkeit.

## Lokal starten

ES-Module benötigen einen lokalen HTTP-Server. Im Projektverzeichnis:

```bash
python3 -m http.server 8000
```

Danach öffnen:

- Startseite: `http://localhost:8000/`
- Rechner: `http://localhost:8000/automation-rechner.html`

Die HTML-Dateien nicht direkt per `file://` öffnen, da Browser ES-Module dort häufig blockieren.

## Struktur

```text
index.html                              Startseite
automation-rechner.html                Rechner-Seite und semantische Seitenstruktur
impressum.html                         bestehendes Impressum
datenschutz.html                       bestehende Datenschutzerklärung
assets/css/automation-calculator.css   Rechner-Design und Druckansicht
assets/js/site-config.js               zentrale Website-Konfiguration
assets/js/site-shell.js                Navigation, Cookie-Banner, gemeinsame Initialisierung
assets/js/calculator/calculator-config.js
assets/js/calculator/pricing-config.js
assets/js/calculator/calculator-state.js
assets/js/calculator/pricing-engine.js
assets/js/calculator/recommendation-engine.js
assets/js/calculator/lead-summary.js
assets/js/calculator/calculator-ui.js
tests/pricing-engine.test.mjs           Pricing-Regressionstests
```

## Pricing Engine

Die Kalkulation folgt diesem Modell:

```text
Automation Core
+ notwendige Zugänge und Connectoren
+ Funktions-, Daten-, Dokument-, KI- und Betriebsbausteine
+ technisches Risiko
+ projekttypspezifischer Mindestpreis
+ kaufmännische Budgetrundung
= unverbindliche Budgetindikation
```

Eng verwandte Bausteine werden durch Scope Compression zusammengeführt. `replaces`- und `excludes`-Regeln verhindern unter anderem, dass eine konkrete DATEV-Anbindung gleichzeitig als REST-, ERP- und DATEV-Connector berechnet wird. Browser-, Desktop- und Remote-Automatisierungen haben eigene Floors.

Care und Hosting werden separat empfohlen. Drittanbieter-, Lizenz-, Telefonie-, OCR-, KI- oder verbrauchsabhängige Kosten sind nicht im Projektpreis versteckt.

### Preise ändern

Alle Preiswerte, Floors, Budgetbänder, Care-Pakete und Hosting-Varianten liegen in:

```text
assets/js/calculator/pricing-config.js
```

Der UI-Code enthält keine Einzelpreise. Interne Stundensätze und Sales-Regeln sind als `visibility: "internal"` gekennzeichnet und werden nicht gerendert.

### Care ändern

Die Paketwerte stehen im Export `CARE` in `pricing-config.js`. Die Auswahlregeln stehen getrennt in `recommendation-engine.js`.

### System oder Auswahloption hinzufügen

Systeme und kundenfreundliche Texte stehen in `calculator-config.js`. Für ein neues System:

1. System der passenden Gruppe in `SYSTEM_GROUPS` hinzufügen.
2. Falls nötig in `pricing-engine.js` einer vorhandenen Systemfamilie wie Microsoft, CRM oder ERP zuordnen.
3. Bei einer neuen Integrationsart den Preis ausschließlich in `pricing-config.js` ergänzen.
4. Einen Regressionstest hinzufügen.

## Zentrale Website-Konfiguration

`assets/js/site-config.js` enthält:

- Cal.com-Link
- Kontaktadresse
- Währung und öffentliches Preislabel
- optionalen Lead-Endpunkt

Den Cal.com-Link daher nur dort ändern.

### Lead Endpoint

Standardmäßig ist `calculatorLeadEndpoint` auf `null` gesetzt. Der Rechner zeigt das Ergebnis sofort und ohne Kontaktdaten an; es gibt keinen Fake-Submit.

Für eine spätere Übergabe stehen folgende Bausteine bereit:

- `generateLeadPayload(configuration, result)`
- `generateInternalSummary(configuration, result)`
- `RemoteLeadAdapter`
- `submitCalculatorLead(payload, adapter)`

Vor Aktivierung eines Kontaktformulars oder einer echten Übertragung:

```text
TODO LEGAL REVIEW:
Lead form / calculator submission
```

Die Datenschutzerklärung ist dann fachlich zu prüfen. Lead-Daten werden derzeit weder gesendet noch in `localStorage` gespeichert.

## Tests

Der Node Built-in Test Runner benötigt keine Installation:

```bash
node --test tests/pricing-engine.test.mjs
```

Die Tests decken Minimum/Floor, Excel→E-Mail, DATEV-Szenarien, Browser-RPA, Immobilienportal, OrgaMAX Enterprise Remote, Audit-Dokumentenflow, KI-Service-Postfach und einen kritischen Multi-System-Prozess ab.

## Deployment

Das Verzeichnis kann unverändert auf einem statischen Webserver, CDN oder Static Hosting veröffentlicht werden. Der Server sollte:

- `index.html` als Standarddokument ausliefern,
- JavaScript-Module mit korrektem MIME-Type ausliefern,
- optional `/automation-rechner` auf `automation-rechner.html` umschreiben,
- HTTPS und übliche Security Header aktivieren.

Für Produktionsumgebungen, in denen interne Kalkulationslogik nicht öffentlich einsehbar sein soll, ist der vorbereitete `RemotePricingProvider` zu verwenden und die Preisberechnung serverseitig umzusetzen.

## Analytics

Der Rechner emittiert ausschließlich lokale `liratech:calculator`-Browser-Events. Es wird keine Analytics-Bibliothek automatisch geladen. Externe Analytics dürfen erst nach passender Einwilligungslogik angebunden werden.
