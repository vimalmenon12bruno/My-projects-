# PROCESS//FORGE — Event Log Studio

A self-contained web page that generates **synthetic event logs for process mining**,
ready to ingest into **SAP Signavio Process Intelligence**. Each industry vertical
produces its own distinct process world — activities, performing roles, case
attributes, source system, rework loops and exception paths.

Open `index.html` in any browser — no build, no dependencies.

## Verticals
Procurement (P2P) · Retail (O2C) · Banking (Loan Origination) · Insurance (Claims) ·
Healthcare (Patient Flow) · Manufacturing (Production Order) · Telecom (Provisioning) ·
IT Service Management (Incident) · Logistics (Outbound Shipment) · Utilities (New Connection)

## Output
CSV (UTF-8) with the Signavio-ready schema:
`Case ID · Activity · Start Timestamp · End Timestamp · Resource · Role · <case attributes>`

Controls: number of cases, process noise, time span, and a random seed for
reproducible logs. Live KPIs, directly-follows flow, and variant analysis update
as you go.

> Synthetic data only — for demos, PoCs and training. No production data.
