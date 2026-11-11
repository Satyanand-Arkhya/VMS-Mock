# AT VMS

Prototype for the Vendor Management System (VMS) application.

## Overview
This repository contains a front-end prototype for stakeholder review and sign-off before production development,
and the product requirements document it implements.

| Path | What it is |
|---|---|
| `prototype/` | Static clickable prototype (HTML, CSS, JavaScript, no build step) |
| `Arkhya Tech VMS — Product Requirements Document.docx` | PRD, kept in sync with the prototype |
| `netlify.toml` | Netlify settings: publishes the `prototype` folder |

## Run locally

```bash
cd prototype
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deploy on Netlify
1. In Netlify, choose **Add new site → Import an existing project** and pick this GitHub repository.
2. Netlify reads `netlify.toml`, so leave the build command empty and the publish directory as `prototype`.
3. Deploy. Every push to `main` redeploys the site.

## Included
- Persona-based dashboards (Super Admin, Account Manager, Vendor, W-2 and 1099 resources), switchable from the sidebar
- Client, Vendor, Team Member, Invoice, Document Tracker and Admin User Management screens
- Review-ready static prototype
