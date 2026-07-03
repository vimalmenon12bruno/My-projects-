# PROCESS//FORGE — Event Log Studio on SAP BTP

A **self-contained** web application that generates synthetic event logs for process
mining, ready to ingest into **SAP Signavio Process Intelligence**. Ten industry
verticals, each with its own activities, roles, case attributes, source system,
rework loops and exception paths. The entire app is a single HTML file
(`ui/index.html`) with no runtime dependencies, no backend and no external calls —
so it can be hosted by any static server.

This repository packages that app for **SAP Business Technology Platform** three ways.
Pick the one that matches how your BTP subaccount is set up.

| Path | BTP runtime | Best when… | Auth | Effort |
|------|-------------|-----------|------|--------|
| **A — Staticfile buildpack** | Cloud Foundry | You want the fastest public URL | none | `cf push` |
| **B — MTA → HTML5 App Repository** | Cloud Foundry | You use SAP Build Work Zone / an approuter | none¹ | `mbt` + `cf deploy` |
| **C — Container** | Kyma | You run Kubernetes workloads | none | `docker` + `kubectl` |

¹ Configured public here (`authenticationMethod: none`). Add XSUAA if you want SAP login — see notes below.

> **Data note:** everything the app produces is synthetic — for demos, PoCs and training.
> No production data leaves the browser; generation happens entirely client-side.

---

## Preview locally first

```bash
cd event-log-generator
npm start          # serves ui/ at http://localhost:8080  (uses npx http-server)
```

Or just open `ui/index.html` in a browser.

---

## Path A — Cloud Foundry staticfile buildpack (recommended quick start)

The simplest way to get a public URL on BTP. Serves `ui/` with nginx via the
`staticfile_buildpack`.

**Prerequisites**
- [Cloud Foundry CLI (`cf` v8)](https://github.com/cloudfoundry/cli)
- A BTP subaccount with the **Cloud Foundry** environment enabled and a Space

**Deploy**
```bash
cd event-log-generator
cf login -a https://api.cf.<region>.hana.ondemand.com   # e.g. eu10-004
cf push
```

`cf push` reads `manifest.yml`, uploads `ui/`, and prints the route, e.g.
`https://processforge-<random>.cfapps.<region>.hana.ondemand.com`.

- Config lives in `manifest.yml` (buildpack, memory, route) and `ui/Staticfile`
  (`force_https`, HSTS, SPA fallback).
- To pin a fixed hostname, replace `random-route: true` in `manifest.yml` with an
  explicit `routes:` entry (see the commented example in the file).

---

## Path B — MTA → HTML5 Application Repository (SAP-native)

Deploys the UI into the **HTML5 Application Repository** and serves it through a
**standalone approuter**. This is the idiomatic BTP layout and the basis for
integrating the app as a tile in **SAP Build Work Zone**.

**Prerequisites**
- `cf` CLI **plus** the MultiApps plugin: `cf install-plugin multiapps`
- The [Cloud MTA Build Tool](https://sap.github.io/cloud-mta-build-tool/) `mbt`
  (`npm i -g mbt`) and Node.js 20+
- Entitlements in your subaccount for **HTML5 Application Repository**
  (`html5-apps-repo`, plans `app-host` and `app-runtime`)

**Deploy**
```bash
cd event-log-generator
npm run deploy:mta
# = mbt build -p=cf  &&  cf deploy mta_archives/processforge_1.0.0.mtar
```

What the `mta.yaml` does:
1. `processforge-ui` (html5 module) runs `npm run build` → assembles `ui/dist/`
   (a cross-platform copy in `ui/build.js`; there is no bundler because the app is
   one file) and zips it.
2. `processforge-ui-deployer` uploads that content into the `app-host` service.
3. `processforge-router` (approuter) serves it from `html5-apps-repo-rt`.

After deploy, `cf apps` shows `processforge-router`; its route is the app URL.

**Add SAP login (optional):** to require authentication, add an `xsuaa` resource +
`xs-security.json`, set `authenticationMethod: "route"` in both `router/xs-app.json`
and `ui/xs-app.json`, and mark routes `authenticationType: "xsuaa"`.

**Work Zone tile (optional):** register the app in SAP Build Work Zone and add it
to a site — it is already tagged `sap.cloud.public: true` in `ui/manifest.json`.

---

## Path C — Kyma (container)

Runs the app as a non-root nginx container behind the Kyma API Gateway.

**Prerequisites**
- BTP subaccount with the **Kyma** environment enabled; `kubectl` pointed at its kubeconfig
- A container registry your Kyma cluster can pull from

**Deploy**
```bash
cd event-log-generator
docker build -t <registry>/processforge:1.0.0 .
docker push  <registry>/processforge:1.0.0

# set image + review the host, then:
#   deploy/kyma/processforge.yaml  ->  image: <registry>/processforge:1.0.0
kubectl apply -f deploy/kyma/processforge.yaml
```

The `APIRule` exposes it at `https://processforge.<your-kyma-domain>`.
`deploy/nginx.conf` adds security headers and the SPA fallback; the image uses
`nginxinc/nginx-unprivileged` (listens on 8080, runs as non-root) so it satisfies
Kyma's restricted Pod Security Standard.

---

## Project structure

```
event-log-generator/
├── ui/
│   ├── index.html        # THE app — self-contained SPA (single source of truth)
│   ├── Staticfile        # Cloud Foundry staticfile buildpack config (Path A)
│   ├── xs-app.json       # approuter routing for HTML5 repo (Path B)
│   ├── manifest.json     # Fiori app descriptor for HTML5 repo (Path B)
│   ├── package.json      # build script for the MTA html5 module (Path B)
│   ├── build.js          # assembles ui/dist/ for mbt (Path B)
│   └── .cfignore         # keeps Path A's pushed app lean
├── router/               # standalone approuter (Path B)
│   ├── package.json
│   └── xs-app.json
├── deploy/
│   ├── nginx.conf        # container web server config (Path C)
│   └── kyma/processforge.yaml  # Deployment + Service + APIRule (Path C)
├── manifest.yml          # cf push descriptor (Path A)
├── mta.yaml              # Multi-Target Application descriptor (Path B)
├── Dockerfile            # container image (Path C)
└── package.json          # convenience scripts (start / build:mta / deploy:*)
```

## What the app does

Select an industry vertical, set the number of cases, process noise, time span and a
random seed, then export a Signavio-ready CSV:

```
Case ID · Activity · Start Timestamp · End Timestamp · Resource · Role · <case attributes>
```

Live KPIs, a directly-follows process flow and variant analysis update as you go.
Verticals: Procurement (P2P), Retail (O2C), Banking (loan origination), Insurance
(claims), Healthcare, Manufacturing, Telecom, IT Service Management, Logistics and
Utilities.

### AI Process Designer (generative)

Describe **any** process in plain language ("a pharmaceutical clinical trial approval
process with ethics review and rework loops") and Claude designs a bespoke process
model — domain-specific activities, roles, case attributes, source system and an
exception path — which plugs straight into the generator to produce a unique event
log, flow and CSV.

- **Bring-your-own-key:** paste an Anthropic API key (stored only in your browser's
  localStorage, sent directly to `api.anthropic.com`). Uses forced tool-calling on
  `claude-opus-4-8` by default (Sonnet 5 / Haiku 4.5 selectable) for guaranteed
  structured output. Works on any hosted deployment (GitHub Pages, BTP, Kyma).
- **No-key fallback:** **Copy prompt** → run it in Claude → **Paste process JSON**.
  This path also works inside the sandboxed claude.ai artifact, where a browser can't
  call the API directly.

No key is stored or transmitted anywhere except Anthropic; the app remains fully
static with no backend.

### Reference BPMN model (conformance target)

For the selected process — built-in **or** AI-designed — the app generates a
standardized **BPMN 2.0** model of the happy path and renders it inline as a diagram:

- **optional steps** → XOR gateway split/join (take the task or skip it)
- **rework** → BPMN loop markers (`standardLoopCharacteristics`)
- **exception path** → an XOR branch to a **terminate** end event
- **automated steps** → `serviceTask`; human steps → `userTask`

Download the **`.bpmn`** (valid BPMN 2.0 XML with full diagram interchange) and import
it into **SAP Signavio Process Intelligence** as the **conformance target**, then run
conformance/fitness analysis of the discovered process (from the generated event log)
against this reference model. The `.bpmn` also opens in Camunda, bpmn.io and any other
BPMN 2.0 tool. Generated fully client-side — no API key required.
