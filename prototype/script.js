/* ------------------------------------------------------------------
 * Arkhya Tech VMS — clickable prototype
 * Reference date for all sample data: Tue, 10 Nov 2026.
 * Current billing period under reconciliation: October 2026.
 * ------------------------------------------------------------------ */

/* ---------- Small render helpers ---------- */

const BADGE_TONES = {
  approved: ['Active', 'Valid', 'Approved', 'Matched', 'Signed', 'Submitted', 'Uploaded', 'Paid', 'Current'],
  rejected: ['Rejected', 'Expired', 'Inactive', 'Mismatch', 'Missing'],
  warning: ['Expiring Soon', 'Review', 'Due', 'Due Soon', 'Action Needed', 'Draft'],
  progress: ['In Progress', 'Pending', 'Incomplete', 'Awaiting Client Invoice', 'Onboarding', 'Not Started', 'Invited'],
  neutral: ['Not Applicable', 'Closed', 'Ended', 'Superseded']
};

function b(text) {
  const tone = Object.keys(BADGE_TONES).find((key) => BADGE_TONES[key].includes(text)) || 'neutral';
  return `<span class="status-badge status-${tone}">${text}</span>`;
}

function acts(...labels) {
  const targets = {
    'View / Edit': 'clientEdit',
    'Client invoice': 'invoiceUpload',
    'Vendor Invoice': 'vendorInvoices',
    'Consultants': 'vendorConsultants',
    'Open': 'clientEdit',
    'View': 'clients',
    'Edit': 'clientEdit',
    'View all': 'dashboard',
    'Correct': 'invoiceUpload'
  };

  // View opens a document preview pop-up; Download / Replace act on the row's document (no page change).
  const special = {
    View: '<button type="button" class="link-btn" data-preview>View</button>',
    Download: '<button type="button" class="link-btn" data-download>Download</button>',
    Replace: '<button type="button" class="link-btn" data-replace>Replace</button>'
  };
  return `<div class="row-actions">${labels.map((l) => special[l] || `<button class="link-btn" data-target="${targets[l] || 'dashboard'}">${l}</button>`).join('')}</div>`;
}

/* ---------- Toast notifications ---------- */

function showToast({ tone = 'success', title, text = '' }) {
  let stack = document.getElementById('toastStack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toastStack';
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${tone}`;
  toast.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${tone === 'error' ? '✕' : '✓'}</span>
    <div class="toast-body"><div class="toast-title"></div>${text ? '<div class="toast-text"></div>' : ''}</div>
    <button type="button" class="toast-close" aria-label="Dismiss">×</button>`;
  toast.querySelector('.toast-title').textContent = title;
  if (text) toast.querySelector('.toast-text').textContent = text;
  const remove = () => { toast.classList.add('toast-out'); setTimeout(() => toast.remove(), 200); };
  toast.querySelector('.toast-close').addEventListener('click', remove);
  stack.appendChild(toast);
  setTimeout(remove, tone === 'error' ? 6000 : 4500);
}

/* ---------- Document preview pop-up (every "View" on a file) ---------- */

// File name for a View / Download button: its data value, else the row's file chip, else the row's first cell.
function docNameFor(btn, attr) {
  const v = btn.getAttribute(attr);
  if (v) return v;
  const row = btn.closest('tr') || btn.closest('.doc-cell')?.parentElement;
  const chip = (btn.closest('.doc-cell') || row)?.querySelector('.file-chip');
  if (chip) return chip.childNodes[1]?.textContent.trim() || chip.textContent.trim();
  return row?.querySelector('td')?.textContent.trim() || 'Document';
}

let previewPushed = false;
const sentNotifications = new Set(); // reminders / requests sent this session (one per owner + document + kind per day)

function closePreview(fromHistory) {
  const el = document.getElementById('docPreview');
  if (!el) return false;
  el.remove();
  if (!document.querySelector('.modal-backdrop')) document.body.classList.remove('modal-open');
  if (previewPushed && !fromHistory) { previewPushed = false; history.back(); }
  previewPushed = false;
  return true;
}

function openPreview(name) {
  closePreview(true);
  const ext = (name.match(/\.([a-z0-9]+)$/i) || [])[1];
  const el = document.createElement('div');
  el.id = 'docPreview';
  el.className = 'modal-backdrop preview-backdrop';
  el.innerHTML = `
    <div class="modal preview-modal" role="dialog" aria-modal="true" aria-labelledby="previewTitle" tabindex="-1">
      <div class="modal-head">
        <div><h2 class="modal-title" id="previewTitle"></h2><p class="modal-desc">Document preview</p></div>
        <button type="button" class="modal-close" aria-label="Close">×</button>
      </div>
      <div class="modal-body preview-body">
        <div class="preview-page">
          <div class="preview-badge">${(ext || 'DOC').toUpperCase()}</div>
          <div class="preview-name"></div>
          ${Array.from({ length: 9 }, (_, i) => `<div class="preview-line" style="width:${[92, 80, 86, 60, 94, 72, 88, 66, 40][i]}%"></div>`).join('')}
        </div>
      </div>
      <div class="form-footer modal-footer"><span class="person-sub inline">Preview only · sample data</span>
        <div class="form-buttons"><button type="button" class="btn btn-secondary" data-close>Close</button><button type="button" class="btn btn-primary" data-dl>Download</button></div>
      </div>
    </div>`;
  el.querySelector('#previewTitle').textContent = name;
  el.querySelector('.preview-name').textContent = name;
  document.body.appendChild(el);
  document.body.classList.add('modal-open');
  const close = () => closePreview(false);
  el.addEventListener('click', (e) => { if (e.target === el) close(); });
  el.querySelector('.modal-close').addEventListener('click', close);
  el.querySelector('[data-close]').addEventListener('click', close);
  el.querySelector('[data-dl]').addEventListener('click', () => showToast({ title: 'Download started', text: name }));
  el.querySelector('.modal').focus({ preventScroll: true });
  // Its own history entry, so Android / browser Back closes the preview first.
  if (history.state && history.state.nav) {
    history.pushState({ ...history.state, preview: true }, '');
    previewPushed = true;
  }
}

document.addEventListener('click', (e) => {
  const view = e.target.closest('[data-preview]');
  if (view) { e.stopPropagation(); openPreview(docNameFor(view, 'data-preview')); return; }
  const dl = e.target.closest('[data-download]');
  if (dl) { e.stopPropagation(); showToast({ title: 'Download started', text: docNameFor(dl, 'data-download') }); return; }
  const rep = e.target.closest('[data-replace]');
  if (rep) {
    e.stopPropagation();
    const docName = docNameFor(rep, 'data-replace');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.jpg,.jpeg,.png';
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'docx', 'jpg', 'jpeg', 'png'].includes(ext)) showToast({ tone: 'error', title: `${docName} not replaced`, text: 'Only PDF, DOCX, JPG, JPEG or PNG files are allowed.' });
      else if (file.size > 5 * 1024 * 1024) showToast({ tone: 'error', title: `${docName} not replaced`, text: `${file.name} is larger than 5 MB.` });
      else showToast({ title: `${docName} replaced`, text: `${file.name} uploaded as a new version. The earlier version is kept in history.` });
    });
    input.click();
  }
}, true);

// Opens a pop-up with that client's invoices for the billing period (stays on the Clients page).
function clientInvoiceAction(clientName) {
  return `<button class="link-btn" data-target="clientInvoices" data-client="${clientName}">Client invoice</button>`;
}

const DASHBOARD_KPI_TARGETS = {
  superadmin: ['clients', 'vendors', 'teamMembers', 'teamMembers'],
  accountmanager: ['clients', 'vendorList', 'invoiceUpload', 'invoiceUpload'],
  vendor: ['consultants', 'invoices', 'rejectedInvoice', 'docs'],
  w2: ['status', 'status', 'docs'],
  w9: ['status', 'correction', 'docs']
};

function person(name, sub) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  return `<div class="person-cell"><span class="avatar">${initials}</span><span><span class="person-name">${name}</span>${sub ? `<span class="person-sub">${sub}</span>` : ''}</span></div>`;
}

function sub(main, secondary) {
  return `<span class="person-name">${main}</span><span class="person-sub">${secondary}</span>`;
}

function mono(text) {
  return `<span class="mono">${text}</span>`;
}

function diff(text) {
  return `<span class="diff-bad">${text}</span>`;
}

function fileChip(name, size) {
  return `<span class="file-chip"><span class="file-ext">${name.split('.').pop().toUpperCase()}</span>${name}${size ? `<span class="person-sub inline">${size}</span>` : ''}</span>`;
}

/* ---------- Team member profiles (View / Edit from Team Members) ---------- */

// Document row: [name, file or null, last updated, expires, status]
const TEAM_MEMBERS = {
  'Maya Reed': {
    type: 'W-2', role: 'Data Analyst', email: 'maya.reed@outlook.com', phone: '(646) 555-0128',
    address: '312 W 88th St, Apt 4B, New York, NY 10024', ssn: '•••-••-2290',
    client: 'HTC', rate: '62.00', location: 'Remote', start: '2026-03-02', end: '2027-02-26',
    term: 'Net 10', status: 'Active', am: 'Alicia Ross',
    docs: [
      ['W-4', 'W4_Reed_2026.pdf', 'Mar 2, 2026', '—', 'Valid'],
      ['I-9', null, '—', '—', 'Incomplete'],
      ['Employment contract', 'Reed_Employment_Contract.pdf', 'Feb 24, 2026', 'Feb 26, 2027', 'Valid'],
      ['ACH form', 'Reed_ACH.pdf', 'Mar 2, 2026', '—', 'Valid']
    ]
  },
  'Jordan Blake': {
    type: '1099', role: 'UX Consultant', email: 'jordan@blakeux.studio', phone: '(415) 555-0186',
    address: '2201 Mission St, Suite 5, San Francisco, CA 94110', ssn: '•••-••-7731',
    client: 'HTC', rate: '90.00', location: 'Remote', start: '2026-07-06', end: '2027-01-08',
    term: 'Net 10', status: 'Active', am: 'Alicia Ross',
    docs: [
      ['1099 contract — HTC', 'Blake_1099_HTC.pdf', 'Jul 1, 2026', 'Jan 8, 2027', 'Signed'],
      ['W-9', 'Blake_W9_2026.pdf', 'Jun 30, 2026', '—', 'Valid'],
      ['ACH form', 'Blake_ACH.pdf', 'Jun 30, 2026', '—', 'Valid']
    ]
  },
  'Deepa Kumar': {
    type: 'Consultant', vendor: 'Coral Staffing LLC', vendorContact: 'Daniel Ortiz · d.ortiz@coralstaffing.com',
    role: 'Business Analyst', email: 'deepa.kumar@coralstaffing.com', phone: '(512) 555-0147',
    client: 'Persistent', rate: '80.00', location: 'Boston, MA', start: '2026-01-12', end: '2026-12-31',
    term: 'Net 10', status: 'Active', am: 'Alicia Ross',
    docs: [
      ['Resume', 'Deepa_Kumar_Resume.pdf', 'Jan 5, 2026', '—', 'Valid'],
      ['Work authorization (H-1B)', 'Kumar_H1B_Approval.pdf', 'Dec 1, 2025', 'Nov 30, 2026', 'Expiring Soon'],
      // Audit report: [doc, file, uploaded, period end, status, period covered, earlier reports kept in history]
      ['I-9 audit report', 'Kumar_I9_Audit_Jul-Dec26.pdf', 'Jul 3, 2026', 'Dec 31, 2026', 'Valid', 'Jul 1, 2026 – Dec 31, 2026 (6 months)', 1],
      ['E-Verify document', 'Kumar_EVerify.pdf', 'Jan 9, 2026', '—', 'Valid']
    ]
  },
  'Rinaldo Silva': {
    type: 'Consultant', vendor: 'Coral Staffing LLC', vendorContact: 'Daniel Ortiz · d.ortiz@coralstaffing.com',
    role: 'QA Engineer', email: 'rinaldo.silva@coralstaffing.com', phone: '(512) 555-0163',
    client: 'Citus Tech', rate: '72.00', location: 'Remote', start: '2026-09-14', end: '2027-03-12',
    term: 'Net 10', status: 'Active', am: 'Benjamin Cole',
    docs: [
      ['Resume', 'Rinaldo_Silva_Resume.pdf', 'Sep 1, 2026', '—', 'Valid'],
      ['Work authorization (Green Card)', 'Silva_GC.pdf', 'Sep 1, 2026', 'Aug 14, 2033', 'Valid'],
      ['I-9 audit report', 'Silva_I9_Audit_Sep-Dec26.pdf', 'Sep 15, 2026', 'Dec 13, 2026', 'Valid', 'Sep 14, 2026 – Dec 13, 2026 (3 months)', 0],
      ['E-Verify document', 'Silva_EVerify.pdf', 'Sep 10, 2026', '—', 'Valid']
    ]
  },
  'Kevin Singh': {
    type: 'Consultant', vendor: 'Summit IT Solutions', vendorContact: 'Ravi Menon · ravi@summitits.com',
    role: 'Java Developer', email: 'kevin.singh@summitits.com', phone: '(732) 555-0119',
    client: 'Persistent', rate: '85.00', location: 'Boston, MA', start: '2026-04-01', end: '2027-03-31',
    term: 'Net 10', status: 'Active', am: 'Alicia Ross',
    docs: [
      ['Resume', 'Kevin_Singh_Resume.pdf', 'Mar 20, 2026', '—', 'Valid'],
      ['Work authorization (EAD)', 'Singh_EAD.pdf', 'Mar 20, 2026', 'Jun 30, 2027', 'Valid'],
      ['I-9 audit report', 'Singh_I9_Audit_Q4-26.pdf', 'Oct 2, 2026', 'Dec 31, 2026', 'Valid', 'Oct 1, 2026 – Dec 31, 2026 (3 months)', 2],
      ['E-Verify document', 'Singh_EVerify.pdf', 'Mar 28, 2026', '—', 'Valid']
    ]
  },
  'Omar Haddad': {
    type: 'Consultant', vendor: 'Coral Staffing LLC', vendorContact: 'Daniel Ortiz · d.ortiz@coralstaffing.com',
    role: 'DevOps Engineer', email: 'omar.haddad@coralstaffing.com', phone: '(512) 555-0152',
    client: 'Persistent', rate: '84.00', location: 'Chicago, IL', start: '2026-02-02', end: '2027-01-29',
    term: 'Net 10', status: 'Active', am: 'Alicia Ross',
    docs: [
      ['Resume', 'Omar_Haddad_Resume.pdf', 'Jan 20, 2026', '—', 'Valid'],
      ['Work authorization (Green Card)', 'Haddad_GC.pdf', 'Jan 20, 2026', 'Mar 3, 2034', 'Valid'],
      ['I-9 audit report', 'Haddad_I9_Audit_Aug26-Jan27.pdf', 'Aug 3, 2026', 'Jan 31, 2027', 'Valid', 'Aug 1, 2026 – Jan 31, 2027 (6 months)', 1],
      ['E-Verify document', 'Haddad_EVerify.pdf', 'Jan 28, 2026', '—', 'Valid']
    ]
  },
  'Sofia Marin': {
    type: 'Consultant', vendor: 'Coral Staffing LLC', vendorContact: 'Daniel Ortiz · d.ortiz@coralstaffing.com',
    role: 'Scrum Master', email: 'sofia.marin@coralstaffing.com', phone: '(512) 555-0188',
    client: 'Citus Tech', rate: '76.00', location: 'Remote', start: '2026-05-04', end: '2026-11-27',
    term: 'Net 10', status: 'Active', am: 'Alicia Ross',
    docs: [
      ['Resume', 'Sofia_Marin_Resume.pdf', 'Apr 22, 2026', '—', 'Valid'],
      ['Work authorization (TN)', 'Marin_TN_Approval.pdf', 'Apr 22, 2026', 'Apr 30, 2029', 'Valid'],
      ['I-9 audit report', 'Marin_I9_Audit_Nov26-Jan27.pdf', 'Nov 2, 2026', 'Jan 31, 2027', 'Valid', 'Nov 1, 2026 – Jan 31, 2027 (3 months)', 2],
      ['E-Verify document', null, '—', '—', 'Incomplete']
    ]
  },
  'Priya Shah': {
    type: 'Consultant', vendor: 'Coral Staffing LLC', vendorContact: 'Daniel Ortiz · d.ortiz@coralstaffing.com',
    role: 'Data Engineer', email: 'priya.shah@coralstaffing.com', phone: '(512) 555-0174',
    client: 'Citus Tech', rate: '88.00', location: 'Remote', start: '2026-11-16', end: '2027-05-14',
    term: 'Net 10', status: 'Onboarding', am: 'Alicia Ross',
    docs: [
      ['Resume', 'Priya_Shah_Resume.pdf', 'Nov 9, 2026', '—', 'Valid'],
      ['Work authorization (H-1B)', 'Shah_H1B_Approval.pdf', 'Nov 9, 2026', 'Oct 1, 2028', 'Valid'],
      ['I-9 audit report', null, '—', '—', 'Incomplete'],
      ['E-Verify document', null, '—', '—', 'Incomplete']
    ]
  },
  // Just added by the vendor: no client yet. The account manager maps the client from Edit.
  'Marcus Lee': {
    type: 'Consultant', vendor: 'Coral Staffing LLC', vendorContact: 'Daniel Ortiz · d.ortiz@coralstaffing.com',
    role: 'Salesforce Developer', email: 'marcus.lee@coralstaffing.com', phone: '(512) 555-0193',
    client: '', rate: '92.00', location: 'San Francisco, CA', start: '2026-12-07', end: '2027-06-04',
    term: 'Net 10', status: 'Onboarding', am: 'Alicia Ross',
    docs: [
      ['Resume', 'Marcus_Lee_Resume.pdf', 'Nov 12, 2026', '—', 'Valid'],
      ['I-9', null, '—', '—', 'Incomplete'],
      ['E-Verify document', null, '—', '—', 'Incomplete'],
      ['I-9 audit report', null, '—', '—', 'Incomplete']
    ]
  }
};

// Payment term per vendor, set by the account manager when the vendor is created (or later on Edit Vendor).
// Every consultant of that vendor uses it; the vendor cannot change it.
const VENDOR_PAYMENT_TERMS = {
  'Coral Staffing LLC': 'Net 10',
  'Summit IT Solutions': 'Net 10',
  'BluePeak Consulting Inc.': 'Net 10',
  'Cascade Data Partners': 'Net 10',
  'Ridgeline Talent Group': 'Net 10'
};
function vendorPaymentTerm(vendor) {
  return VENDOR_PAYMENT_TERMS[vendor] || 'Net 10';
}

// Client cell for a consultant the account manager has not mapped to a client yet.
const NOT_MAPPED = '<span class="person-sub inline">Not mapped</span>';

let selectedMember = 'Maya Reed';

// Vendor consultant rows: View opens the consultant's profile, Edit opens their edit form (both pop-ups).
function consultantActions(name) {
  return `<div class="row-actions"><button class="link-btn" data-target="memberDetail" data-member="${name}">View</button><button class="link-btn" data-target="memberEdit" data-member="${name}">Edit</button></div>`;
}

function memberAction(name, withSubmissions) {
  return `<div class="row-actions"><button class="link-btn" data-target="memberDetail" data-member="${name}">View</button><button class="link-btn" data-target="memberEdit" data-member="${name}">Edit</button>${withSubmissions ? `<button class="link-btn" data-target="memberSubmissions" data-member="${name}">Invoices &amp; Timesheets</button>` : ''}</div>`;
}

/* ---------- Invoices & timesheets per person (Super Admin) ---------- */

// invoice / timesheet: file name, null = not uploaded (admin can upload), 'na' = not applicable (W-2 has no invoice)
const MEMBER_SUBMISSIONS = {
  'Maya Reed': [
    { period: 'Nov 2026', client: 'HTC', ref: '—', hours: '—', amount: '—', invoice: 'na', timesheet: null, status: 'Due' },
    { period: 'Oct 2026', client: 'HTC', ref: 'TS-2026-10-0093', hours: '168', amount: '—', invoice: 'na', timesheet: 'Reed_Oct26.pdf', status: 'Approved' },
    { period: 'Sep 2026', client: 'HTC', ref: 'TS-2026-09-0071', hours: '160', amount: '—', invoice: 'na', timesheet: 'Reed_Sep26_v2.pdf', status: 'Approved' }
  ],
  'Jordan Blake': [
    { period: 'Oct 2026', client: 'HTC', ref: 'INV-2026-10-0151', hours: '152', amount: '$13,680.00', invoice: 'BlakeUX-0046.pdf', timesheet: 'Blake_HTC_Oct26.pdf', status: 'Awaiting Client Invoice' },
    { period: 'Sep 2026', client: 'HTC', ref: 'INV-2026-09-0388', hours: '160', amount: '$14,400.00', invoice: 'BlakeUX-0039.pdf', timesheet: 'Blake_HTC_Sep26.pdf', status: 'Rejected' },
    { period: 'Aug 2026', client: 'HTC', ref: 'INV-2026-08-0301', hours: '168', amount: '$15,120.00', invoice: 'BlakeUX-0035.pdf', timesheet: 'Blake_HTC_Aug26.pdf', status: 'Approved' }
  ],
  'Deepa Kumar': [
    { period: 'Oct 2026', client: 'Persistent', ref: 'INV-2026-10-0203', hours: '160', amount: '$12,800.00', invoice: 'CS-INV-10477.pdf', timesheet: 'Kumar_Oct26_timesheet.pdf', status: 'Rejected' },
    { period: 'Sep 2026', client: 'Persistent', ref: 'INV-2026-09-0145', hours: '168', amount: '$13,440.00', invoice: 'CS-INV-10391.pdf', timesheet: 'Kumar_Sep26_timesheet.pdf', status: 'Approved' }
  ],
  'Rinaldo Silva': [
    { period: 'Oct 2026', client: 'Citus Tech', ref: 'INV-2026-10-0142', hours: '168', amount: '$12,096.00', invoice: 'CS-INV-10482.pdf', timesheet: 'Silva_Oct26_timesheet.pdf', status: 'Approved' },
    { period: 'Sep 2026', client: 'Citus Tech', ref: 'INV-2026-09-0133', hours: '96', amount: '$6,912.00', invoice: 'CS-INV-10388.pdf', timesheet: null, status: 'In Progress' }
  ],
  'Kevin Singh': [
    { period: 'Oct 2026', client: 'Persistent', ref: 'INV-2026-10-0187', hours: '160', amount: '$13,600.00', invoice: 'SIT-INV-2210.pdf', timesheet: 'Singh_Oct26_timesheet.pdf', status: 'Rejected' },
    { period: 'Sep 2026', client: 'Persistent', ref: 'INV-2026-09-0129', hours: '168', amount: '$14,280.00', invoice: null, timesheet: 'Singh_Sep26_timesheet.pdf', status: 'In Progress' }
  ],
  'Priya Shah': [
    { period: 'Nov 2026', client: 'Citus Tech', ref: '—', hours: '—', amount: '—', invoice: null, timesheet: null, status: 'Not Started' }
  ]
};

function submissionDocCell(file, kind) {
  if (file === 'na') return '<span class="person-sub inline">Not applicable</span>';
  if (file) return `<div class="doc-cell">${fileChip(file)}<button type="button" class="link-btn" data-preview="${file}">View</button></div>`;
  return `<span class="cell-upload-wrap"><button type="button" class="upload-mini cell-upload">Upload ${kind}</button>
    <input type="file" class="upload-input" accept=".pdf,.docx,.jpg,.jpeg,.png" hidden /></span>`;
}

function memberSubmissionsScreen(screen, name) {
  const m = TEAM_MEMBERS[name] || TEAM_MEMBERS['Maya Reed'];
  const rows = MEMBER_SUBMISSIONS[name] || [];
  const missing = rows.reduce((n, r) => n + (r.invoice === null) + (r.timesheet === null), 0);
  return {
    ...screen,
    title: `${name} · Invoices & Timesheets`,
    description: m.type === 'W-2'
      ? 'W-2 resources submit a monthly timesheet only. You can submit a timesheet on their behalf, or upload one that is missing.'
      : `${m.type === 'Consultant' ? `Normally submitted by ${m.vendor}. ` : ''}You can submit an invoice and timesheet on their behalf, or upload a missing document.`,
    actions: [
      { label: 'View Profile', target: 'memberDetail' },
      { label: m.type === 'W-2' ? 'Upload Timesheet' : 'Upload Invoice', target: 'submitOnBehalf', primary: true }
    ],
    table: {
      title: 'Submissions',
      chip: missing ? `${missing} document${missing > 1 ? 's' : ''} missing` : 'All documents on file',
      noSearch: true,
      headers: ['Period', 'Client', 'Reference', 'Hours', 'Amount', 'Invoice', 'Timesheet', 'Status'],
      rows: rows.map((r) => [
        r.period, r.client,
        r.ref === '—' ? '—' : `${mono(r.ref)}${r.by ? `<span class="person-sub">By ${r.by} (on behalf)</span>` : ''}`,
        r.hours, r.amount, submissionDocCell(r.invoice, 'invoice'), submissionDocCell(r.timesheet, 'timesheet'), b(r.status)
      ])
    }
  };
}

/* ---------- Submit on behalf (Account Manager / Super Admin) ---------- */

const BILLING_PERIODS = ['November 2026', 'October 2026'];

function submitOnBehalfScreen(screen, name) {
  const m = TEAM_MEMBERS[name] || TEAM_MEMBERS['Maya Reed'];
  const w2 = m.type === 'W-2';
  const me = currentPersona().user.name;
  return {
    ...screen,
    title: w2 ? `Upload Timesheet for ${name}` : `Upload Invoice for ${name}`,
    description: `${w2 ? 'Timesheet' : 'Invoice and timesheet'} submitted by you on ${name}’s behalf${m.type === 'Consultant' ? ` (vendor: ${m.vendor})` : ''}. Reconciliation runs automatically on submit.`,
    form: {
      sections: [
        {
          title: 'On behalf of',
          fields: [
            { label: 'Person', value: `${name} · ${typeLabel(m)}`, readonly: true, lock: 'Selected' },
            { label: 'Submitted by', value: `${me} (on behalf)`, readonly: true, lock: 'Recorded in Audit Log' }
          ]
        },
        {
          title: w2 ? 'Timesheet' : 'Invoice',
          fields: [
            { label: 'Assignment', type: 'select', options: [`${m.client} — ${m.role}`], required: true },
            { label: 'Billing period', type: 'select', options: BILLING_PERIODS, required: true },
            { label: w2 ? 'Total hours' : 'Total billed hours', placeholder: 'e.g. 160', required: true },
            ...(w2 ? [] : [
              { label: 'Hourly rate', value: `$${m.rate}`, readonly: true },
              { label: 'Invoice amount (USD)', value: '$0.00', readonly: true }
            ]),
            { label: 'Payment term', value: m.term, readonly: true }
          ]
        },
        {
          title: 'Attachments',
          hint: 'PDF, DOCX, JPG, JPEG or PNG · max 5 MB per file.',
          fields: [
            ...(w2 ? [] : [{ label: 'Invoice', type: 'upload', required: true }]),
            { label: 'Timesheet', type: 'upload', required: true }
          ]
        }
      ],
      submit: { label: 'Submit for Reconciliation', target: 'memberSubmissions', action: 'on-behalf' },
      cancel: { label: 'Cancel', target: 'memberSubmissions' }
    }
  };
}

/* ---------- Admin User Management (Super Admin): account managers ---------- */

const ACCOUNT_MANAGERS = [
  { name: 'Alicia Ross', email: 'a.ross@arkhyatech.com', phone: '(212) 555-0141', clients: 12, vendors: 18, status: 'Active', lastLogin: 'Today, 9:52 AM' },
  { name: 'Benjamin Cole', email: 'b.cole@arkhyatech.com', phone: '(213) 555-0177', clients: 9, vendors: 11, status: 'Active', lastLogin: 'Yesterday, 5:10 PM' },
  { name: 'Priya Natarajan', email: 'p.natarajan@arkhyatech.com', phone: '(312) 555-0119', clients: 7, vendors: 9, status: 'Active', lastLogin: 'Nov 9, 2026' },
  { name: 'Hannah Lee', email: 'h.lee@arkhyatech.com', phone: '(617) 555-0103', clients: 0, vendors: 0, status: 'Invited', lastLogin: '—' }
];

let selectedAm = 0;
let flashMessage = null; // one-time success banner shown on the next screen

// The only clients in the prototype.
const CLIENT_NAMES = ['Persistent', 'HTC', 'Citus Tech'];

// A client has one or more account managers (PRD CL-8). [] = none yet.
const CLIENT_AM = {
  'Persistent': ['Alicia Ross', 'Priya Natarajan'],
  'HTC': ['Alicia Ross'],
  'Citus Tech': ['Benjamin Cole', 'Alicia Ross']
};

// Client options for the Account Manager forms: hint shows who else manages each client.
function clientOptions(forAm) {
  return Object.entries(CLIENT_AM).map(([client, ams]) => {
    const others = ams.filter((n) => n !== forAm);
    return { value: client, hint: others.length ? `${forAm && ams.includes(forAm) ? 'Also' : 'Managed by'} ${others.join(', ')}` : ams.length ? 'Only you' : 'No account manager yet' };
  });
}

// Account manager options for the client forms (Inactive ones are not offered).
function accountManagerOptions() {
  return ACCOUNT_MANAGERS.filter((a) => a.status !== 'Inactive').map((a) => ({ value: a.name, hint: a.status === 'Invited' ? 'Invited' : `${a.clients} clients` }));
}

const clientNameOf = (form) => formValue(form, 'Client name');

// Client forms: "Account managers" is a multi-select for Super Admin; read-only for an Account Manager.
function clientFormScreen(screen) {
  if (!screen.form) return screen;
  const nameField = screen.form.sections.flatMap((s) => s.fields).find((f) => f.label === 'Client name');
  const client = nameField ? nameField.value : '';
  const current = screen.id === 'clientEdit' ? (CLIENT_AM[client] || []) : [];
  const amField = activePersona === 'superadmin'
    ? { label: 'Account managers', type: 'multiselect', full: true, required: true, placeholder: 'Select account managers…', options: accountManagerOptions(), selected: current }
    : { label: 'Account managers', value: current.length ? current.map((n) => (n === currentPersona().user.name ? `${n} (you)` : n)).join(', ') : `${currentPersona().user.name} (you)`, readonly: true, lock: 'Assigned by Super Admin', full: true };
  return {
    ...screen,
    form: {
      ...screen.form,
      sections: screen.form.sections.map((s) => ({ ...s, fields: s.fields.map((f) => (/^Account manager/.test(f.label || '') ? amField : f)) })),
      submit: activePersona === 'superadmin' ? { ...screen.form.submit, action: 'client-save' } : screen.form.submit
    }
  };
}

// Clients list: Account Managers column comes from CLIENT_AM so it reflects every change.
function clientsTable(table) {
  const col = table.headers.indexOf('Account Manager');
  if (col < 0) return table;
  return {
    ...table,
    headers: table.headers.map((h, i) => (i === col ? 'Account Managers' : h)),
    rows: table.rows.map((row) => {
      const name = (row[0].match(/person-name">([^<]+)/) || [])[1];
      const ams = CLIENT_AM[name];
      return ams ? row.map((cell, i) => (i === col ? (ams.length ? ams.join('<br>') : '<span class="person-sub inline">None</span>') : cell)) : row;
    })
  };
}

function adminUsersScreen(screen) {
  return {
    ...screen,
    table: {
      title: 'Account managers',
      total: ACCOUNT_MANAGERS.length,
      headers: ['Name', 'Phone', 'Clients', 'Vendors', 'Status', 'Last Login', 'Actions'],
      rows: ACCOUNT_MANAGERS.map((am, i) => [
        person(am.name, am.email), `<span class="nowrap">${am.phone}</span>`, String(am.clients), String(am.vendors), b(am.status), `<span class="nowrap">${am.lastLogin}</span>`,
        `<div class="row-actions" data-am-row="${i}">
          <button class="link-btn" data-target="adminUserEdit" data-am="${i}">Edit</button>
          ${am.status === 'Invited' ? `<button type="button" class="link-btn am-resend" data-am="${i}">Resend invite</button>` : ''}
          <button type="button" class="link-btn link-danger am-delete" data-am="${i}">Delete</button>
        </div>`
      ])
    }
  };
}

function adminUserAddScreen(screen) {
  return {
    ...screen,
    form: {
      sections: [
        {
          title: 'Account manager details',
          hint: 'On save, an invite email with a single-use link (valid 72 h) is sent so they can set a password.',
          fields: [
            { label: 'Full name', placeholder: 'e.g. Daniel Kim', required: true },
            { label: 'Work email', placeholder: 'name@arkhyatech.com', required: true },
            { label: 'Phone', placeholder: '(555) 555-0100' },
            { label: 'Role', value: 'Account Manager', readonly: true, lock: 'Fixed' }
          ]
        },
        {
          title: 'Clients',
          hint: 'Select one or more clients. A client can have several account managers; picking one that is already managed adds this account manager alongside.',
          fields: [
            { label: 'Clients', type: 'multiselect', full: true, required: true, placeholder: 'Select clients…', options: clientOptions(null), selected: [] }
          ]
        }
      ],
      submit: { label: 'Save and Send Invite', target: 'adminUsers', action: 'am-invite' },
      cancel: { label: 'Cancel', target: 'adminUsers' }
    }
  };
}

function adminUserEditScreen(screen) {
  const am = ACCOUNT_MANAGERS[selectedAm] || ACCOUNT_MANAGERS[0];
  const statuses = am.status === 'Invited' ? ['Invited', 'Inactive'] : withCurrent(am.status, ['Active', 'Inactive']);
  return {
    ...screen,
    title: `Edit ${am.name}`,
    description: `Account manager for ${am.clients} client${am.clients === 1 ? '' : 's'} and ${am.vendors} vendor${am.vendors === 1 ? '' : 's'}. Inactive account managers cannot sign in.`,
    form: {
      sections: [
        {
          title: 'Account manager details',
          fields: [
            { label: 'Full name', value: am.name, required: true },
            { label: 'Work email', value: am.email, required: true },
            { label: 'Phone', value: am.phone },
            { label: 'Role', value: 'Account Manager', readonly: true, lock: 'Fixed' },
            { label: 'Status', type: 'select', options: statuses }
          ]
        },
        {
          title: 'Clients',
          hint: 'Add or remove clients. A client can be removed only if another account manager still manages it.',
          fields: [
            {
              label: 'Clients', type: 'multiselect', full: true, required: true, placeholder: 'Select clients…',
              options: clientOptions(am.name),
              selected: Object.keys(CLIENT_AM).filter((c) => CLIENT_AM[c].includes(am.name))
            }
          ]
        }
      ],
      submit: { label: 'Save Changes', target: 'adminUsers', action: 'am-save' },
      cancel: { label: 'Cancel', target: 'adminUsers' }
    }
  };
}

function formValue(form, label) {
  const field = [...form.querySelectorAll('.field')].find((f) => f.querySelector('label')?.childNodes[0]?.textContent.trim() === label);
  const control = field?.querySelector('input, select');
  return control ? control.value.trim() : '';
}

function showFieldError(form, label, message) {
  const field = [...form.querySelectorAll('.field')].find((f) => f.querySelector('label')?.childNodes[0]?.textContent.trim() === label);
  if (!field) return;
  let note = field.querySelector('.field-error');
  if (!note) {
    note = document.createElement('span');
    note.className = 'field-note field-error';
    field.appendChild(note);
  }
  note.textContent = message;
}

/* ---------- 1099 invoice view ---------- */

const RESOURCE_INVOICES = {
  'INV-2026-10-0151': { client: 'HTC', period: 'October 2026', hours: '152', rate: '$90.00', amount: '$13,680.00', term: 'Net 10', submitted: 'Nov 2, 2026', status: 'Awaiting Client Invoice', invoice: ['BlakeUX-0046.pdf', '148 KB'], timesheet: ['Blake_HTC_Oct26.pdf', '92 KB'] },
  'INV-2026-09-0388': { client: 'HTC', period: 'September 2026', hours: '160', rate: '$90.00', amount: '$14,400.00', term: 'Net 10', submitted: 'Oct 4, 2026', status: 'Rejected', reason: 'Billing period did not match the client invoice.', invoice: ['BlakeUX-0039.pdf', '146 KB'], timesheet: ['Blake_HTC_Sep26.pdf', '90 KB'] },
  'INV-2026-08-0301': { client: 'HTC', period: 'August 2026', hours: '168', rate: '$90.00', amount: '$15,120.00', term: 'Net 10', submitted: 'Sep 2, 2026', status: 'Approved', invoice: ['BlakeUX-0035.pdf', '149 KB'], timesheet: ['Blake_HTC_Aug26.pdf', '93 KB'] }
};

let selectedInvoice = 'INV-2026-10-0151';

function invoiceViewAction(id) {
  return `<button class="link-btn" data-target="invoiceView" data-invoice="${id}">View</button>`;
}

function invoiceViewScreen(screen, id) {
  const inv = RESOURCE_INVOICES[id] || RESOURCE_INVOICES['INV-2026-10-0151'];
  const docRow = (label, [file, size]) => [label, fileChip(file, size), inv.submitted, '<div class="row-actions"><button type="button" class="link-btn" data-preview>View</button><button type="button" class="link-btn" data-download>Download</button></div>'];
  return {
    ...screen,
    title: id,
    description: `${inv.client} · ${inv.period}. The invoice and timesheet you submitted.`,
    actions: inv.status === 'Rejected' ? [{ label: 'Correct Invoice', target: 'correction', primary: true }] : [],
    alert: inv.reason ? { tone: 'danger', title: 'This invoice was rejected', text: inv.reason } : undefined,
    detail: {
      sections: [{
        title: 'Invoice details',
        items: [
          { label: 'Client', value: inv.client },
          { label: 'Billing period', value: inv.period },
          { label: 'Total billed hours', value: inv.hours },
          { label: 'Hourly rate', value: inv.rate },
          { label: 'Invoice amount (USD)', value: inv.amount },
          { label: 'Payment term', value: inv.term },
          { label: 'Submitted', value: inv.submitted },
          { label: 'Status', value: b(inv.status) }
        ]
      }],
      documents: {
        title: 'Invoice & timesheet',
        headers: ['Document', 'File', 'Uploaded', 'Actions'],
        rows: [docRow('Invoice', inv.invoice), docRow('Timesheet', inv.timesheet)]
      }
    }
  };
}

/* ---------- Document Tracker: versions and history ---------- */

// versions: oldest first; the last one is current. Each: [version, file, uploaded, uploaded by, valid until]
const DOCUMENTS = {
  'msa-northwind': { name: 'MSA', owner: 'HTC', type: 'Client', status: 'Valid', versions: [
    ['v1', 'HTC_MSA_2021.pdf', 'Feb 12, 2021', 'Arun Krishnan', 'Feb 11, 2023'],
    ['v2', 'HTC_MSA_2023.pdf', 'Feb 10, 2023', 'Alicia Ross', 'Feb 11, 2025'],
    ['v3', 'HTC_MSA_2025.pdf', 'Feb 7, 2025', 'Alicia Ross', 'Feb 12, 2027']] },
  'coi-coral': { name: 'COI', owner: 'Coral Staffing LLC', type: 'Vendor', status: 'Expiring Soon', versions: [
    ['v1', 'Coral_COI_2024.pdf', 'Nov 20, 2024', 'Daniel Ortiz', 'Nov 25, 2025'],
    ['v2', 'Coral_COI_2025.pdf', 'Nov 18, 2025', 'Daniel Ortiz', 'Nov 25, 2026']] },
  'wa-kumar': { name: 'Work authorization (H-1B)', owner: 'Deepa Kumar', type: 'Consultant', status: 'Expiring Soon', versions: [
    ['v1', 'Kumar_H1B_Approval.pdf', 'Dec 1, 2025', 'Daniel Ortiz', 'Nov 30, 2026']] },
  'i9-reed': { name: 'I-9', owner: 'Maya Reed', type: 'W-2 Resource', status: 'Incomplete', versions: [] },
  'everify-torres': { name: 'E-Verify', owner: 'Ana Torres', type: 'Consultant', status: 'Not Applicable', versions: [] },
  'msa-blueharbor': { name: 'MSA', owner: 'Persistent', type: 'Client', status: 'Expiring Soon', versions: [
    ['v1', 'BlueHarbor_MSA_2022.pdf', 'Dec 5, 2022', 'Arun Krishnan', 'Dec 9, 2024'],
    ['v2', 'BlueHarbor_MSA_2024.pdf', 'Dec 4, 2024', 'Alicia Ross', 'Dec 9, 2026']] },
  'ach-ridgeline': { name: 'ACH form', owner: 'Ridgeline Talent Group', type: 'Vendor', status: 'Incomplete', versions: [] },
  'w9-summit': { name: 'W-9', owner: 'Summit IT Solutions', type: 'Vendor', status: 'Valid', versions: [
    ['v1', 'Summit_W9_2025.pdf', 'Jul 1, 2025', 'Ravi Menon', 'Jul 1, 2026'],
    ['v2', 'Summit_W9_2026.pdf', 'Jun 28, 2026', 'Ravi Menon', 'Jul 1, 2027']] }
};

const TRACKER_DOC_IDS = {
  superadmin: ['msa-northwind', 'coi-coral', 'wa-kumar', 'i9-reed', 'everify-torres'],
  accountmanager: ['coi-coral', 'wa-kumar', 'msa-blueharbor', 'ach-ridgeline', 'w9-summit']
};

let selectedDoc = 'msa-northwind';

function docVersionCell(id) {
  const d = DOCUMENTS[id];
  if (!d.versions.length) return '<span class="person-sub inline">—</span>';
  const current = d.versions[d.versions.length - 1][0];
  const past = d.versions.length - 1;
  return `<span class="version-tag">${current}</span>${past ? `<button class="link-btn version-link" data-target="docDetail" data-doc="${id}">${past} past version${past > 1 ? 's' : ''}</button>` : '<span class="person-sub">No earlier versions</span>'}`;
}

function docActions(id) {
  const d = DOCUMENTS[id];
  const parts = [];
  if (d.versions.length || d.status === 'Not Applicable') parts.push(`<button class="link-btn" data-target="docDetail" data-doc="${id}">View</button>`);
  if (['Expiring Soon', 'Expired'].includes(d.status)) parts.push(`<button type="button" class="link-btn doc-notify" data-doc="${id}" data-kind="remind">Remind</button>`);
  if (d.status === 'Incomplete') parts.push(`<button type="button" class="link-btn doc-notify" data-doc="${id}" data-kind="request">Request</button>`);
  return `<div class="row-actions">${parts.join('')}</div>`;
}

function trackerTable(table) {
  const ids = TRACKER_DOC_IDS[activePersona] || [];
  return {
    ...table,
    headers: ['Document', 'Owner', 'Owner Type', 'Version', 'Expires', 'Status', 'Actions'],
    rows: ids.map((id) => {
      const d = DOCUMENTS[id];
      const current = d.versions[d.versions.length - 1];
      return [d.name, d.owner, d.type, docVersionCell(id), current ? current[4] : '—', b(d.status), docActions(id)];
    })
  };
}

function docDetailScreen(screen, id) {
  const d = DOCUMENTS[id] || DOCUMENTS['msa-northwind'];
  const n = d.versions.length;
  const current = d.versions[n - 1];
  const alerts = {
    'Expiring Soon': { tone: 'warning', title: 'Expiring soon', text: `The current version expires ${current?.[4]}. The owner and account manager have been alerted.` },
    Expired: { tone: 'danger', title: 'Expired', text: `The current version expired ${current?.[4]}. A new version is needed.` },
    Incomplete: { tone: 'warning', title: 'Not uploaded yet', text: 'No version of this document is on file.' }
  };
  return {
    ...screen,
    title: `${d.name} · ${d.owner}`,
    description: `${d.type} document. Every upload keeps the earlier versions, so you can open any past version below.`,
    alert: alerts[d.status],
    detail: {
      sections: [{
        title: 'Document',
        items: [
          { label: 'Document', value: d.name },
          { label: 'Owner', value: `${d.owner} (${d.type})` },
          { label: 'Current version', value: current ? `<span class="version-tag">${current[0]}</span> ${fileChip(current[1])}` : '—' },
          { label: 'Versions on file', value: String(n) },
          { label: 'Valid until', value: current ? current[4] : '—' },
          { label: 'Status', value: b(d.status) }
        ]
      }],
      documents: {
        title: 'Version history',
        hint: n > 1 ? 'Newest first. Superseded versions stay read-only for audit.' : n ? 'Only one version so far.' : 'No versions yet.',
        headers: ['Version', 'File', 'Uploaded', 'Uploaded by', 'Valid until', 'Status', 'Actions'],
        rows: n
          ? [...d.versions].reverse().map(([v, file, uploaded, by, until], i) => [
              `<span class="version-tag">${v}</span>`, fileChip(file), uploaded, by, until,
              i === 0 ? b('Current') : b('Superseded'),
              '<div class="row-actions"><button type="button" class="link-btn" data-preview>View</button><button type="button" class="link-btn" data-download>Download</button></div>'
            ])
          : [['<span class="person-sub inline">No versions uploaded.</span>', '', '', '', '', '', '']]
      }
    }
  };
}

/* ---------- Invoices (Super Admin / Account Manager / Vendor): one shared record per submission ---------- */

// invoice / timesheet: file name, null = not uploaded, 'na' = not applicable (W-2 has no invoice).
// clientHours: hours on the client invoice, or null while it has not been uploaded.
const INVOICES = {
  'INV-2026-10-0142': { person: 'Rinaldo Silva', sub: 'Coral Staffing', vendor: 'Coral Staffing LLC', client: 'Citus Tech', period: 'October 2026', hours: 168, clientHours: 168, rate: 72, term: 'Net 10', submitted: 'Nov 4, 2026 (v2)', status: 'Approved', invoice: 'CS-INV-10482.pdf', timesheet: 'Silva_Oct26_timesheet.pdf' },
  'INV-2026-10-0151': { person: 'Jordan Blake', sub: '1099', client: 'HTC', period: 'October 2026', hours: 152, clientHours: null, rate: 90, term: 'Net 10', submitted: 'Nov 2, 2026', status: 'In Progress', invoice: 'BlakeUX-0046.pdf', timesheet: 'Blake_HTC_Oct26.pdf' },
  'INV-2026-10-0187': { person: 'Kevin Singh', sub: 'Summit IT', vendor: 'Summit IT Solutions', client: 'Persistent', period: 'October 2026', hours: 160, clientHours: 152, rate: 85, term: 'Net 10', submitted: 'Nov 3, 2026', status: 'Rejected', invoice: 'SIT-INV-2210.pdf', timesheet: 'Singh_Oct26_timesheet.pdf' },
  'TS-2026-10-0093': { person: 'Maya Reed', sub: 'W-2 · timesheet', w2: true, client: 'HTC', period: 'October 2026', hours: 168, clientHours: 168, rate: 62, term: 'Net 10', submitted: 'Nov 2, 2026', status: 'Approved', invoice: 'na', timesheet: 'Reed_Oct26.pdf' },
  'INV-2026-10-0203': { person: 'Deepa Kumar', sub: 'Coral Staffing', vendor: 'Coral Staffing LLC', client: 'Persistent', period: 'October 2026', hours: 160, clientHours: 168, rate: 80, term: 'Net 10', submitted: 'Nov 3, 2026', status: 'Rejected', invoice: 'CS-INV-10477.pdf', timesheet: 'Kumar_Oct26_timesheet.pdf' },
  'INV-2026-10-0211': { person: 'Ana Torres', sub: 'BluePeak Consulting', vendor: 'BluePeak Consulting Inc.', client: 'Persistent', period: 'October 2026', hours: 176, clientHours: 176, rate: 88, term: 'Net 10', submitted: 'Nov 4, 2026', status: 'Approved', invoice: 'BP-INV-5521.pdf', timesheet: 'Torres_Oct26_timesheet.pdf' },
  'INV-2026-10-0198': { person: 'Omar Haddad', sub: 'Coral Staffing', vendor: 'Coral Staffing LLC', client: 'Persistent', period: 'October 2026', hours: 144, clientHours: null, rate: 84, term: 'Net 10', submitted: 'Nov 3, 2026', status: 'In Progress', invoice: 'CS-INV-10479.pdf', timesheet: null },
  'INV-2026-10-0176': { person: 'Sofia Marin', sub: 'Coral Staffing', vendor: 'Coral Staffing LLC', client: 'Citus Tech', period: 'October 2026', hours: 168, clientHours: null, rate: 76, term: 'Net 10', submitted: 'Nov 2, 2026', status: 'In Progress', invoice: 'CS-INV-10471.pdf', timesheet: 'Marin_Oct26_timesheet.pdf' },
  'NS-ELENA': { person: 'Elena Petrova', sub: 'Coral Staffing', vendor: 'Coral Staffing LLC', client: 'Citus Tech', period: 'October 2026', hours: null, clientHours: 160, rate: 78, term: 'Net 10', submitted: '—', status: 'Not Submitted', invoice: null, timesheet: null },
  'NS-LENA': { person: 'Lena Fischer', sub: 'Summit IT', vendor: 'Summit IT Solutions', client: 'Persistent', period: 'October 2026', hours: null, clientHours: 168, rate: 82, term: 'Net 10', submitted: '—', status: 'Not Submitted', invoice: null, timesheet: null },
  'NS-AVA': { person: 'Ava Chen', sub: '1099', client: 'HTC', period: 'October 2026', hours: null, clientHours: 160, rate: 86, term: 'Net 10', submitted: '—', status: 'Not Submitted', invoice: null, timesheet: null }
};

const AUDIT_INVOICE_IDS = ['INV-2026-10-0142', 'INV-2026-10-0151', 'INV-2026-10-0187', 'TS-2026-10-0093', 'INV-2026-10-0203', 'INV-2026-10-0211', 'NS-LENA', 'NS-AVA'];
const VENDOR_INVOICE_IDS = ['INV-2026-10-0203', 'INV-2026-10-0142', 'INV-2026-10-0198', 'INV-2026-10-0176', 'NS-ELENA'];

/* ---------- Invoice Management (Super Admin / Account Manager): manual review per person ----------
   One record per person for the billing period. clientInvoice / doc: file, null = not uploaded yet.
   doc is the vendor invoice (consultant), the resource invoice (1099) or the timesheet (W-2).
   review: 'Approved' | 'Rejected' | null (not reviewed yet). inv links the shared invoice record, if any. */
const IM_PERIOD = 'October 2026';
const IM_RECORDS = {
  'im-kumar': { person: 'Deepa Kumar', type: 'Consultant', vendor: 'Coral Staffing LLC', client: 'Persistent', clientInvoice: 'PER-Oct26-Kumar.pdf', clientHours: 168, doc: 'CS-INV-10477.pdf', docHours: 160, review: 'Rejected', reason: 'Vendor billed 160 h; the client invoice shows 168 h. Please correct the hours and resubmit.', inv: 'INV-2026-10-0203' },
  'im-singh': { person: 'Kevin Singh', type: 'Consultant', vendor: 'Summit IT Solutions', client: 'Persistent', clientInvoice: 'PER-Oct26-Singh.pdf', clientHours: 152, doc: 'SIT-INV-2210.pdf', docHours: 160, review: 'Rejected', reason: 'Client approved 152 h for October; vendor invoice shows 160 h.', inv: 'INV-2026-10-0187' },
  'im-silva': { person: 'Rinaldo Silva', type: 'Consultant', vendor: 'Coral Staffing LLC', client: 'Citus Tech', clientInvoice: 'CT-Oct26-Silva.pdf', clientHours: 168, doc: 'CS-INV-10482.pdf', docHours: 168, review: 'Approved', inv: 'INV-2026-10-0142' },
  'im-torres': { person: 'Ana Torres', type: 'Consultant', vendor: 'BluePeak Consulting Inc.', client: 'Persistent', clientInvoice: 'PER-Oct26-Torres.pdf', clientHours: 176, doc: 'BP-INV-5521.pdf', docHours: 176, review: 'Approved', inv: 'INV-2026-10-0211' },
  'im-menon': { person: 'Ravi Menon', type: 'Consultant', vendor: 'Cascade Data Partners', client: 'HTC', clientInvoice: 'HTC-Oct26-Menon.pdf', clientHours: 144, doc: 'CD-INV-0912.pdf', docHours: 144, review: null },
  'im-haddad': { person: 'Omar Haddad', type: 'Consultant', vendor: 'Coral Staffing LLC', client: 'Persistent', clientInvoice: null, clientHours: null, doc: 'CS-INV-10479.pdf', docHours: 144, review: null, inv: 'INV-2026-10-0198' },
  'im-marin': { person: 'Sofia Marin', type: 'Consultant', vendor: 'Coral Staffing LLC', client: 'Citus Tech', clientInvoice: null, clientHours: null, doc: 'CS-INV-10471.pdf', docHours: 168, review: null, inv: 'INV-2026-10-0176' },
  'im-fischer': { person: 'Lena Fischer', type: 'Consultant', vendor: 'Summit IT Solutions', client: 'Persistent', clientInvoice: 'PER-Oct26-Fischer.pdf', clientHours: 168, doc: null, docHours: null, review: null, inv: 'NS-LENA' },
  'im-petrova': { person: 'Elena Petrova', type: 'Consultant', vendor: 'Coral Staffing LLC', client: 'Citus Tech', clientInvoice: 'CT-Oct26-Petrova.pdf', clientHours: 160, doc: null, docHours: null, review: null, inv: 'NS-ELENA' },
  'im-reed': { person: 'Maya Reed', type: 'W-2', client: 'HTC', clientInvoice: 'HTC-Oct26-Maya.pdf', clientHours: 168, doc: 'Reed_Oct26.pdf', docHours: 168, review: 'Approved', inv: 'TS-2026-10-0093' },
  'im-morgan': { person: 'Alex Morgan', type: 'W-2', client: 'HTC', clientInvoice: 'HTC-Oct26-Morgan.pdf', clientHours: 160, doc: 'Morgan_Oct26.pdf', docHours: 160, review: null },
  'im-liu': { person: 'Grace Liu', type: 'W-2', client: 'Persistent', clientInvoice: null, clientHours: null, doc: 'Liu_Oct26.pdf', docHours: 168, review: null },
  'im-blake': { person: 'Jordan Blake', type: '1099', client: 'HTC', clientInvoice: null, clientHours: null, doc: 'BlakeUX-0046.pdf', docHours: 152, review: null, inv: 'INV-2026-10-0151' },
  'im-chen': { person: 'Ava Chen', type: '1099', client: 'HTC', clientInvoice: 'HTC-Oct26-Chen.pdf', clientHours: 160, doc: null, docHours: null, review: null, inv: 'NS-AVA' },
  'im-patel': { person: 'Noah Patel', type: '1099', client: 'Citus Tech', clientInvoice: 'CT-Oct26-Patel.pdf', clientHours: 128, doc: 'Patel-INV-031.pdf', docHours: 120, review: 'Rejected', reason: 'Invoice shows 120 h; the client invoice shows 128 h for October.' }
};
const IM_TABS = ['Vendor Consultants', 'W-2', '1099'];
const IM_TAB_TYPES = ['Consultant', 'W-2', '1099'];
let selectedRec = 'im-menon';
let imStatusFilter = 'All statuses';
let imRejecting = false; // Reject clicked in the review pop-up: show the reason box

// "In Progress" while either document is missing, or while both are in but not yet reviewed.
function imStatus(r) {
  if (!r.clientInvoice || !r.doc) return 'In Progress';
  return r.review || 'In Progress';
}
function imDocLabel(r) {
  return r.type === 'Consultant' ? 'Vendor invoice' : r.type === 'W-2' ? 'Timesheet' : 'Resource invoice';
}
function imStatusNote(r) {
  if (!r.clientInvoice && !r.doc) return 'Waiting for both documents';
  if (!r.clientInvoice) return 'Waiting for client invoice';
  if (!r.doc) return `Waiting for ${imDocLabel(r).toLowerCase()}`;
  if (!r.review) return 'Ready for review';
  return '';
}

/* Client invoice pop-up (from a client's row): every person on that client for the billing period, with the
   client invoice and client billable hours. A missing client invoice can be uploaded here with its hours. */
let ciClient = 'Persistent';
const ciPending = {}; // record id -> chosen file name, until "Save client invoices"

function clientInvoicesScreen(screen) {
  const recs = Object.entries(IM_RECORDS).filter(([, r]) => r.client === ciClient);
  const missing = recs.filter(([, r]) => !r.clientInvoice).length;
  const typeLabel = (r) => (r.type === 'Consultant' ? 'Vendor consultant' : `${r.type} resource`);
  const rows = recs.map(([id, r]) => [
    person(r.person, r.vendor || r.type),
    typeLabel(r),
    r.clientInvoice
      ? `<div class="doc-cell">${fileChip(r.clientInvoice)}<button type="button" class="link-btn" data-preview="${r.clientInvoice}">View</button></div>`
      : ciPending[id]
        ? `<div class="doc-cell">${fileChip(ciPending[id])}</div>`
        : `<span class="cell-upload-wrap"><button type="button" class="upload-mini ci-up" data-rec="${id}">Upload</button><input type="file" class="upload-input" accept=".pdf,.docx,.jpg,.jpeg,.png" hidden /></span>`,
    r.clientInvoice ? String(r.clientHours) : `<input class="cell-input ci-h" data-rec="${id}" inputmode="decimal" placeholder="0" />`,
    `${b(imStatus(r))}${imStatusNote(r) ? `<span class="person-sub">${imStatusNote(r)}</span>` : ''}`
  ]);
  const table = createTable({
    title: `${ciClient} · ${IM_PERIOD}`,
    chip: missing ? `${missing} client invoice${missing > 1 ? 's' : ''} missing` : 'All client invoices uploaded',
    noSearch: true,
    headers: ['Person', 'Type', 'Client Invoice', 'Client Billable Hours', 'Status'],
    rows: rows.length ? rows : [['<span class="person-sub inline">No one is assigned to this client for this period.</span>', '', '', '', '']]
  });
  return {
    ...screen,
    title: `Client invoices · ${ciClient}`,
    description: `Client invoices for ${IM_PERIOD}. Upload a missing client invoice with its billable hours; approving or rejecting is done in Invoice Management.`,
    custom: `${table}${missing ? '<div class="review-actions"><button type="button" class="btn btn-primary" data-ci="save">Save client invoices</button></div>' : ''}`
  };
}

function invoiceManagementScreen(screen) {
  const type = IM_TAB_TYPES[activeTab] || 'Consultant';
  const client = CLIENT_NAMES.includes(selectedClientInvoiceClient) ? selectedClientInvoiceClient : 'All clients';
  const ofType = Object.entries(IM_RECORDS).filter(([, r]) => r.type === type);
  const rows = ofType.filter(([, r]) => (client === 'All clients' || r.client === client)
    && (imStatusFilter === 'All statuses' || imStatus(r) === imStatusFilter));
  const hours = (h, other) => (h == null ? '—' : other != null && h !== other ? diff(String(h)) : String(h));
  const who = type === 'Consultant' ? 'Consultant' : 'Resource';
  const docHoursHead = type === 'Consultant' ? 'Vendor Hours' : 'Resource Hours';
  return {
    ...screen,
    tabs: IM_TABS.map((t, i) => `${t} (${Object.values(IM_RECORDS).filter((r) => r.type === IM_TAB_TYPES[i]).length})`),
    filters: [
      { label: 'Client', options: ['All clients', ...CLIENT_NAMES], selected: client },
      { label: 'Status', options: ['All statuses', 'Approved', 'Rejected', 'In Progress'], selected: imStatusFilter },
      { label: 'Billing period', options: [IM_PERIOD], selected: IM_PERIOD }
    ],
    table: {
      title: `${IM_TABS[activeTab] || IM_TABS[0]} · ${IM_PERIOD}`,
      chip: `${rows.length} ${rows.length === 1 ? 'person' : 'people'}`,
      noSearch: true,
      headers: [who, 'Client', 'Client Hours', docHoursHead, 'Status', 'Actions'],
      rows: rows.length
        ? rows.map(([id, r]) => {
          const note = imStatusNote(r);
          return [
            `<button type="button" class="link-btn person-link" data-target="invoiceReview" data-rec="${id}">${person(r.person, r.vendor || r.type)}</button>`,
            r.client,
            hours(r.clientHours, r.docHours),
            hours(r.docHours, r.clientHours),
            `${b(imStatus(r))}${note ? `<span class="person-sub">${note}</span>` : ''}`,
            `<button type="button" class="link-btn" data-target="invoiceReview" data-rec="${id}">Review</button>`
          ];
        })
        : [['<span class="person-sub inline">No one matches these filters.</span>', '', '', '', '', '']]
    }
  };
}

function imDocPanel(title, file, missingText, uploadable) {
  return `<div class="review-doc">
      <div class="review-doc-title">${title}</div>
      ${file
        ? `<div class="review-paper"><span class="doc-badge">${file.split('.').pop().toUpperCase()}</span><div class="review-paper-name">${file}</div>
            <div class="review-lines"><i></i><i></i><i></i><i></i><i></i></div></div>
           <div class="row-actions"><button type="button" class="link-btn" data-preview="${file}">View</button><button type="button" class="link-btn" data-download>Download</button></div>`
        : `<div class="review-missing">${missingText}</div>
           ${uploadable ? createField({ type: 'upload' }) : ''}`}
    </div>`;
}

function invoiceReviewScreen(screen, id) {
  const r = IM_RECORDS[id] || IM_RECORDS['im-menon'];
  const docLabel = imDocLabel(r);
  const hoursLabel = r.type === 'Consultant' ? 'Vendor billable hours' : 'Resource billable hours';
  const both = !!(r.clientInvoice && r.doc);
  const status = imStatus(r);
  const match = both && r.clientHours === r.docHours;
  const custom = `
    <div class="review-summary">
      <div><span class="person-sub">${r.type === 'Consultant' ? 'Consultant' : `${r.type} resource`}</span><b>${r.person}</b></div>
      ${r.vendor ? `<div><span class="person-sub">Vendor</span><b>${r.vendor}</b></div>` : ''}
      <div><span class="person-sub">Client</span><b>${r.client}</b></div>
      <div><span class="person-sub">Billing period</span><b>${IM_PERIOD}</b></div>
      <div><span class="person-sub">Status</span>${b(status)}</div>
    </div>
    ${r.review === 'Rejected' && r.reason ? `<div class="review-reason"><b>Rejection reason:</b> ${r.reason}<br><span class="person-sub">Waiting for the ${r.type === 'Consultant' ? 'vendor' : 'resource'} to resubmit.</span></div>` : ''}
    <div class="review-grid">
      ${imDocPanel('Client invoice', r.clientInvoice, 'The client invoice is not uploaded yet. Upload it here.', true)}
      ${imDocPanel(docLabel, r.doc, `The ${r.type === 'Consultant' ? 'vendor' : 'resource'} has not submitted the ${docLabel.toLowerCase()} yet.`, false)}
    </div>
    <div class="review-grid">
      <div class="field"><label>Client billable hours</label><input class="rv-client-hours" inputmode="decimal" value="${r.clientHours ?? ''}" placeholder="Enter hours" /></div>
      <div class="field"><label>${hoursLabel}</label><input class="rv-doc-hours readonly" value="${r.docHours ?? ''}" placeholder="Not submitted" readonly /></div>
    </div>
    <div class="review-match ${both ? (match ? 'ok' : 'bad') : ''}" data-match>${both
      ? (match ? `Hours match: ${r.clientHours} h on both.` : `Hours do not match: client ${r.clientHours} h, ${r.type === 'Consultant' ? 'vendor' : 'resource'} ${r.docHours} h.`)
      : 'Both documents are needed before this can be reviewed. Status stays In Progress.'}</div>
    <div class="review-actions">
      ${!r.clientInvoice ? '<button type="button" class="btn btn-secondary" data-rv="save-client">Save client invoice</button>' : ''}
      ${both ? `<button type="button" class="btn btn-reject" data-rv="reject">Reject</button><button type="button" class="btn btn-primary" data-rv="approve">Approve</button>` : ''}
    </div>
    <div class="review-reject" ${imRejecting && both ? '' : 'hidden'}>
      <div class="field"><label>Reason for rejection<span class="req">*</span></label><textarea class="rv-reason" placeholder="Explain what the ${r.type === 'Consultant' ? 'vendor' : 'resource'} must correct"></textarea></div>
      <div class="review-actions"><button type="button" class="btn btn-secondary" data-rv="cancel-reject">Cancel</button><button type="button" class="btn btn-primary" data-rv="submit-reject">Submit rejection</button></div>
    </div>`;
  return {
    ...screen,
    title: `Review · ${r.person}`,
    description: `Compare the client invoice with the ${docLabel.toLowerCase()} and approve or reject.`,
    custom
  };
}

let selectedInv = 'INV-2026-10-0142';
const INVOICE_ALIASES = {}; // placeholder id (NS-…) → real invoice number once submitted
let invoiceReturn = null; // list screen the user opened an invoice from (for breadcrumb / Cancel)

const canManageInvoices = () => activePersona === 'superadmin' || activePersona === 'accountmanager';
const invRef = (id) => (id.startsWith('NS-') ? '—' : id);
const usd = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const invAmount = (inv) => (inv.w2 || inv.hours == null ? '—' : usd(Math.round(inv.hours * inv.rate * 100) / 100));
const invHours = (inv) => {
  if (inv.hours == null) return `— / ${inv.clientHours ?? '—'}`;
  const mismatch = inv.clientHours != null && inv.hours !== inv.clientHours;
  return `${mismatch ? diff(String(inv.hours)) : inv.hours} / ${inv.clientHours ?? '—'}`;
};

function invoiceActions(id) {
  const inv = INVOICES[id];
  const link = (label, target, cls = '') => `<button class="link-btn ${cls}" data-target="${target}" data-inv="${id}">${label}</button>`;
  if (inv.status === 'Not Submitted') {
    return canManageInvoices() ? `<div class="row-actions">${link('Upload', 'invoiceUpdate')}</div>` : '<span class="person-sub inline">Due Nov 15, 2026</span>';
  }
  // A submitted invoice / timesheet can't be edited by anyone; only a rejected one can be corrected.
  const parts = [link('View', 'invoiceDetail')];
  if (inv.status === 'Rejected' && canManageInvoices()) parts.push(link('Upload corrected', 'invoiceUpdate'));
  return `<div class="row-actions">${parts.join('')}</div>`;
}

// File cell: chip if on file; inline Upload (Super Admin / AM) when a submitted invoice is missing it.
function invoiceFileCell(id, kind) {
  const inv = INVOICES[id];
  const file = inv[kind];
  if (file === 'na') return '<span class="person-sub inline">Not applicable</span>';
  if (file) return fileChip(file);
  if (inv.status === 'Not Submitted' || !canManageInvoices()) return '<span class="person-sub inline">Not uploaded</span>';
  return `<span class="cell-upload-wrap"><button type="button" class="upload-mini inv-upload" data-inv="${id}" data-kind="${kind}">Upload ${kind}</button>
    <input type="file" class="upload-input" accept=".pdf,.docx,.jpg,.jpeg,.png" hidden /></span>`;
}

function vendorInvoicesTable(table) {
  return {
    ...table,
    headers: ['Invoice #', 'Consultant', 'Client', 'Hours', 'Amount', 'Invoice', 'Timesheet', 'Status', 'Actions'],
    rows: VENDOR_INVOICE_IDS.map((id) => {
      const inv = INVOICES[id];
      return [mono(invRef(id)), person(inv.person), inv.client, inv.hours ?? '—', invAmount(inv), invoiceFileCell(id, 'invoice'), invoiceFileCell(id, 'timesheet'), b(inv.status), invoiceActions(id)];
    })
  };
}

function invoiceDetailScreen(screen, id) {
  id = INVOICE_ALIASES[id] || id;
  const inv = INVOICES[id] || INVOICES['INV-2026-10-0142'];
  const manage = canManageInvoices();
  const actions = [];
  if (inv.status === 'Rejected') {
    actions.push(manage ? { label: 'Upload Corrected Invoice', target: 'invoiceUpdate', primary: true } : { label: 'Correct Invoice', target: 'rejectedInvoice', primary: true });
  } else if (inv.status === 'Not Submitted' && manage) {
    actions.push({ label: inv.w2 ? 'Upload Timesheet' : 'Upload Invoice & Timesheet', target: 'invoiceUpdate', primary: true });
  }
  const fileRow = (label, kind) => {
    const file = inv[kind];
    return [label, invoiceFileCell(id, kind), file && file !== 'na' ? inv.submitted : '—',
      file && file !== 'na' ? '<div class="row-actions"><button type="button" class="link-btn" data-preview>View</button><button type="button" class="link-btn" data-download>Download</button></div>' : ''];
  };
  return {
    ...screen,
    parent: invoiceReturn || screen.parent,
    title: id.startsWith('NS-') ? `${inv.person} · ${inv.period}` : id,
    description: `${inv.person}${inv.vendor ? ` · ${inv.vendor}` : ''} · ${inv.client} · ${inv.period}.`,
    actions,
    alert: inv.status === 'Rejected'
      ? { tone: 'danger', title: 'Rejected by reconciliation', text: `Total hours: expected ${inv.clientHours} (client invoice), submitted ${inv.hours}.` }
      : inv.status === 'Not Submitted'
        ? { tone: 'warning', title: 'Not submitted yet', text: `No invoice or timesheet for ${inv.period}. Due Nov 15, 2026.${manage ? ' You can upload them on their behalf.' : ''}` }
        : undefined,
    detail: {
      sections: [{
        title: inv.w2 ? 'Timesheet details' : 'Invoice details',
        items: [
          { label: inv.vendor ? 'Consultant' : 'Resource', value: `${inv.person} (${inv.sub})` },
          ...(inv.vendor ? [{ label: 'Vendor', value: inv.vendor }] : []),
          { label: 'Client', value: inv.client },
          { label: 'Billing period', value: inv.period },
          { label: 'Hours submitted', value: inv.hours ?? '—' },
          { label: 'Client invoice hours', value: inv.clientHours ?? 'Awaiting client invoice' },
          ...(inv.w2 ? [] : [{ label: 'Hourly rate', value: usd(inv.rate) }, { label: 'Invoice amount (USD)', value: invAmount(inv) }]),
          { label: 'Payment term', value: inv.term },
          { label: 'Submitted', value: inv.submitted + (inv.by ? ` · by ${inv.by} (on behalf)` : '') },
          { label: 'Status', value: b(inv.status) }
        ]
      }],
      documents: {
        title: inv.w2 ? 'Timesheet' : 'Invoice & timesheet',
        headers: ['Document', 'File', 'Uploaded', 'Actions'],
        rows: [...(inv.w2 ? [] : [fileRow('Invoice', 'invoice')]), fileRow('Timesheet', 'timesheet')]
      }
    }
  };
}

function invoiceUpdateScreen(screen, id) {
  const inv = INVOICES[id] || INVOICES['INV-2026-10-0142'];
  const mode = inv.status === 'Rejected' ? 'correct' : inv.status === 'Not Submitted' ? 'new' : 'edit';
  const me = currentPersona().user.name;
  const titles = {
    correct: `Upload Corrected ${inv.w2 ? 'Timesheet' : 'Invoice'} · ${inv.person}`,
    new: `Upload ${inv.w2 ? 'Timesheet' : 'Invoice & Timesheet'} · ${inv.person}`,
    edit: `Edit ${id}`
  };
  const upload = (label, kind) => ({
    label, type: 'upload', required: mode !== 'edit',
    note: inv[kind] && inv[kind] !== 'na' ? `${mode === 'edit' ? 'Current' : 'Rejected version'}: ${inv[kind]}${mode === 'edit' ? ' — upload a file to replace it' : ''}` : ''
  });
  return {
    ...screen,
    parent: invoiceReturn || screen.parent,
    title: titles[mode],
    description: mode === 'edit'
      ? 'Super Admin edit. Saving re-runs reconciliation and is recorded in the Audit Log.'
      : `Submitted by you on ${inv.person}’s behalf${inv.vendor ? ` (vendor: ${inv.vendor})` : ''}. Reconciliation runs automatically.${mode === 'correct' ? ' The rejected version is kept as Superseded.' : ''}`,
    form: {
      sections: [
        {
          title: 'On behalf of',
          fields: [
            { label: 'Person', value: `${inv.person}${inv.vendor ? ` · ${inv.vendor}` : ` · ${inv.sub}`}`, readonly: true, lock: 'Selected' },
            { label: 'Submitted by', value: `${me}${mode === 'edit' ? '' : ' (on behalf)'}`, readonly: true, lock: 'Recorded in Audit Log' }
          ]
        },
        {
          title: inv.w2 ? 'Timesheet' : 'Invoice',
          hint: inv.clientHours != null ? `Client invoice shows ${inv.clientHours} hours for this period.` : 'Client invoice not uploaded yet.',
          fields: [
            { label: 'Client', value: inv.client, readonly: true, lock: 'From assignment' },
            { label: 'Billing period', value: inv.period, readonly: true, lock: 'From assignment' },
            { label: 'Total billed hours', value: mode === 'edit' ? String(inv.hours) : '', placeholder: inv.clientHours ? `e.g. ${inv.clientHours}` : 'e.g. 160', required: true },
            ...(inv.w2 ? [] : [
              { label: 'Hourly rate', value: usd(inv.rate), readonly: true },
              { label: 'Invoice amount (USD)', value: mode === 'edit' ? invAmount(inv) : '$0.00', readonly: true }
            ]),
            { label: 'Payment term', value: inv.term, readonly: true }
          ]
        },
        {
          title: 'Attachments',
          hint: 'PDF, DOCX, JPG, JPEG or PNG · max 5 MB per file.',
          fields: [...(inv.w2 ? [] : [upload('Invoice', 'invoice')]), upload('Timesheet', 'timesheet')]
        }
      ],
      submit: { label: mode === 'edit' ? 'Save Changes' : 'Submit for Reconciliation', target: 'invoiceDetail', action: 'inv-update' },
      cancel: { label: 'Cancel', target: invoiceReturn || 'invoiceDetail' }
    }
  };
}

function fmtDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function typeLabel(m) {
  return { 'W-2': 'W-2 Employee', '1099': '1099 Contractor', Consultant: 'Vendor Consultant' }[m.type];
}

// Put the current value first so the select shows it.
function withCurrent(value, options) {
  return [value, ...options.filter((o) => o !== value)];
}

// Documents a vendor uploads for its consultant: Resume, I-9, E-Verify and any other named document,
// each with a start and end date. The I-9 audit report is uploaded only by the account manager;
// the vendor can view and download it but not edit or delete it.
// `files` maps document name → [file, size]; `extra` lists other documents already on file.
function vendorConsultantDocFields(files = {}, extra = [], auditPeriod = '') {
  const doc = (label) => {
    const [file, size] = files[label] || [];
    return { label, type: 'upload', validity: true, file, size };
  };
  const [auditFile, auditSize] = files['I-9 audit report'] || [];
  // The account manager uploads a new audit report every 3 or 6 months; only the latest is shown.
  const auditNote = auditPeriod ? `Latest report · covers ${auditPeriod}` : 'A new report is uploaded for each 3- or 6-month period; only the latest is shown.';
  return [
    doc('Resume'),
    doc('I-9'),
    doc('E-Verify document'),
    ...extra.map(doc),
    { label: 'Other documents', type: 'extraDocs', full: true, validity: true },
    { label: 'I-9 audit report', type: 'upload', amOnly: true, readonly: true, lock: 'Uploaded by account manager', file: auditFile, size: auditSize, note: auditNote }
  ];
}

function memberDetailScreen(screen, name) {
  const m = TEAM_MEMBERS[name] || TEAM_MEMBERS['Maya Reed'];
  const personal = [
    { label: 'Full name', value: name },
    { label: 'Resource type', value: typeLabel(m) },
    { label: 'Email', value: m.email },
    { label: 'Phone', value: m.phone },
    ...(m.type === 'Consultant'
      ? [{ label: 'Vendor', value: m.vendor }, { label: 'Vendor contact', value: m.vendorContact }]
      : [{ label: 'SSN', value: m.ssn }, { label: 'Address', value: m.address, full: true }])
  ];
  const engagement = [
    { label: 'Client', value: m.client || 'Not mapped — the account manager maps the client' },
    { label: 'Role', value: m.role },
    { label: 'Hourly rate', value: `$${m.rate}` },
    { label: 'Work location', value: m.location },
    { label: 'Start date', value: fmtDate(m.start) },
    { label: 'End date', value: fmtDate(m.end) },
    { label: 'Payment term', value: m.term },
    { label: 'Account manager', value: m.am },
    { label: 'Status', value: b(m.status) }
  ];
  const missing = m.docs.filter((d) => !d[1]).length;
  return {
    ...screen,
    title: name,
    description: `${typeLabel(m)} · ${m.role}${m.client ? ` at ${m.client}` : ' · client not mapped'}. Full profile and documents on file.`,
    detail: {
      sections: [
        { title: 'Personal details', items: personal },
        { title: 'Assignment', items: engagement }
      ],
      documents: {
        title: 'Documents',
        hint: missing ? `${missing} document${missing > 1 ? 's' : ''} missing — shown as Incomplete in the Document Tracker.` : 'All onboarding documents on file.',
        headers: ['Document', 'File', 'Last Updated', 'Expires', 'Status', 'Actions'],
        // A periodic audit report shows only the latest one, with the period it covers; earlier ones stay in history.
        rows: m.docs.map(([doc, file, updated, expires, status, period, earlier]) => [
          period ? sub(doc, `Latest · covers ${period}${earlier ? ` · ${earlier} earlier in history` : ''}`) : doc,
          file ? fileChip(file) : '<span class="person-sub inline">Not uploaded</span>',
          updated,
          expires,
          b(status),
          file ? '<div class="row-actions"><button type="button" class="link-btn" data-preview>View</button><button type="button" class="link-btn" data-download>Download</button></div>'
            : activePersona === 'vendor' && doc === 'I-9 audit report' ? '<span class="person-sub inline">Uploaded by account manager</span>'
            : `<button type="button" class="link-btn doc-notify" data-kind="request" data-owner="${name}" data-docname="${doc}">Request</button>`
        ])
      }
    }
  };
}

function memberEditScreen(screen, name) {
  const m = TEAM_MEMBERS[name] || TEAM_MEMBERS['Maya Reed'];
  const personal = [
    { label: 'Full name', value: name, required: true },
    { label: 'Resource type', type: 'select', options: withCurrent(typeLabel(m), ['W-2 Employee', '1099 Contractor', 'Vendor Consultant']), required: true },
    { label: 'Email', value: m.email, required: true },
    { label: 'Phone', value: m.phone },
    ...(m.type === 'Consultant'
      ? [
          { label: 'Vendor', type: 'select', options: withCurrent(m.vendor, ['Coral Staffing LLC', 'Summit IT Solutions', 'Ridgeline Talent Group', 'Cascade Data Partners']), required: true },
          { label: 'Vendor contact', value: m.vendorContact }
        ]
      : [
          { label: 'SSN', value: m.ssn, required: true },
          { label: 'Address', value: m.address, full: true }
        ])
  ];
  // A vendor never picks the client for its consultant; the account manager maps it.
  const vendorEditing = activePersona === 'vendor';
  const engagement = [
    ...(vendorEditing ? [] : [{ label: 'Client', type: 'select', options: withCurrent(m.client || 'Select client to map…', CLIENT_NAMES), required: true }]),
    { label: 'Role', value: m.role, required: true },
    { label: 'Hourly rate (USD)', value: m.rate, required: true },
    { label: 'Work location', type: 'select', options: withCurrent(m.location, ['Remote', 'Location']), addOption: { trigger: 'Location', placeholder: 'Enter location name, e.g. San Francisco, CA' } },
    { label: 'Start date', type: 'date', value: m.start },
    { label: 'End date', type: 'date', value: m.end },
    // A vendor consultant's payment term comes from the vendor (set by the account manager); nobody edits it per consultant.
    m.type === 'Consultant'
      ? { label: 'Payment term', value: vendorPaymentTerm(m.vendor), readonly: true, lock: `From vendor · ${m.vendor}` }
      : { label: 'Payment term', type: 'select', options: withCurrent(m.term, ['Net 10', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Immediate', 'Custom']), customInput: true },
    activePersona === 'superadmin'
      ? { label: 'Account manager', type: 'select', options: withCurrent(m.am, ['Alicia Ross', 'Benjamin Cole', 'Priya Natarajan']) }
      : { label: 'Account manager', value: m.am, readonly: true, lock: 'Assigned by Super Admin' },
    { label: 'Status', type: 'select', options: withCurrent(m.status, ['Active', 'Onboarding', 'Inactive', 'Ended']) }
  ];
  const vendorDocNames = ['Resume', 'I-9', 'E-Verify document', 'I-9 audit report'];
  const documents = vendorEditing && m.type === 'Consultant'
    ? vendorConsultantDocFields(
        Object.fromEntries(m.docs.filter(([, file]) => file).map(([doc, file]) => [doc, [file]])),
        m.docs.filter(([doc]) => !vendorDocNames.includes(doc)).map(([doc]) => doc),
        (m.docs.find(([doc]) => doc === 'I-9 audit report') || [])[5]
      )
    : m.docs.map(([doc, file, , expires, , period]) => (/audit report/i.test(doc)
      // Account manager / Super Admin: upload the next periodic audit report (3 or 6 months).
      ? { label: doc, type: 'upload', file: file || undefined, auditPeriod: true, note: period ? `Latest report · covers ${period}` : '' }
      : {
          label: expires !== '—' ? `${doc} (expires ${expires})` : doc,
          type: 'upload',
          file: file || undefined
        }));
  return {
    ...screen,
    title: `Edit ${name}`,
    description: 'Update personal details, assignment and documents. Every change is recorded in the Audit Log.',
    form: {
      sections: [
        { title: 'Personal details', fields: personal },
        { title: 'Assignment', ...(vendorEditing ? { hint: 'The client is mapped by your account manager.' } : {}), fields: engagement },
        {
          title: 'Documents',
          hint: 'PDF, DOCX, JPG or PNG · max 5 MB each. Replacing a file keeps the previous version.',
          // Every document area can take extra named documents (the vendor's list already includes it).
          fields: documents.some((f) => f.type === 'extraDocs') ? documents : [...documents, { label: 'Other documents', type: 'extraDocs', full: true, validity: true }]
        }
      ],
      // Edit opens on its own (not from View), so Save / Cancel return to the list it was opened from.
      submit: { label: 'Save Changes', target: (modalBase && modalBase.screen) || screen.parent },
      cancel: { label: 'Cancel', target: (modalBase && modalBase.screen) || screen.parent }
    }
  };
}

const MEMBER_SCREENS = [
  {
    id: 'memberDetail',
    parent: 'teamMembers',
    title: 'Team Member',
  },
  {
    id: 'memberEdit',
    parent: 'teamMembers',
    title: 'Edit Team Member'
  }
];

/* ---------- Personas ---------- */

const personaConfig = {
  /* =============================================================== */
  superadmin: {
    name: 'Super Admin',
    user: { name: 'Arun Krishnan', role: 'Super Admin', email: 'a.krishnan@arkhyatech.com' },
    notifications: 6,
    nav: [
      { label: 'Dashboard', target: 'dashboard' },
      { label: 'Clients', target: 'clients' },
      { label: 'Vendors', target: 'vendors' },
      { label: 'Team Members', target: 'teamMembers' },
      { label: 'Invoice Management', target: 'invoiceUpload' },
      { label: 'Document Tracker', target: 'documentTracker' },
      // Grouped under a collapsible "Settings" item in the left menu.
      { label: 'User Account Management', target: 'adminUsers', group: 'Settings' },
      { label: 'Audit Log', target: 'audit', group: 'Settings' }
    ],
    screens: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Platform-wide view of clients, vendors, people and the October 2026 billing cycle.',
        kpis: [
          { label: 'Active clients', value: '3', trend: 'Persistent · HTC · Citus Tech', tone: 'neutral' },
          { label: 'Active vendors', value: '84', trend: '+3 this quarter', tone: 'up' },
          { label: 'Vendor consultants', value: '492', trend: '+27 this quarter', tone: 'up' },
          { label: 'W-2 / 1099 resources', value: '215', trend: '142 W-2 · 73 1099', tone: 'neutral' }
        ],
        panels: [
          {
            title: 'Invoices by status — Oct 2026',
            chip: '707 total',
            bars: [
              { label: 'Approved', value: 512, pct: 72, tone: 'approved', target: 'invoiceUpload', status: 'Approved' },
              { label: 'In Progress (a document missing or awaiting review)', value: 157, pct: 23, tone: 'progress', target: 'invoiceUpload', status: 'In Progress' },
              { label: 'Rejected', value: 38, pct: 5, tone: 'rejected', target: 'invoiceUpload', status: 'Rejected' }
            ]
          },
          {
            title: 'Expiring in the next 30 days',
            chip: '20 documents',
            items: [
              { label: sub('COI — Coral Staffing LLC', 'Vendor document'), value: b('Expiring Soon'), meta: 'Nov 25, 2026' },
              { label: sub('Work authorization — Deepa Kumar', 'Consultant · Coral Staffing'), value: b('Expiring Soon'), meta: 'Nov 30, 2026' },
              { label: sub('MSA — Persistent', 'Client document'), value: b('Expiring Soon'), meta: 'Dec 9, 2026' },
              { label: sub('PO — Summit IT Solutions', 'Vendor document'), value: b('Expiring Soon'), meta: 'Dec 4, 2026' }
            ]
          }
        ],
        activity: [
          { who: 'Alicia Ross', what: 'uploaded Oct 2026 client invoices for <b>Persistent</b> (2 of 5 people)', when: '12 min ago' },
          { who: 'Alicia Ross', what: 'rejected <b>INV-2026-10-0187</b> (Kevin Singh) — hours mismatch', when: '12 min ago' },
          { who: 'Daniel Ortiz', what: 'added consultant <b>Priya Shah</b> to Coral Staffing LLC', when: '39 min ago' },
          { who: 'Benjamin Cole', what: 'onboarded vendor <b>Keystone Tech Partners</b>', when: '2 hrs ago' },
          { who: 'Arun Krishnan', what: 'renewed MSA for <b>Citus Tech</b> through Jan 30, 2028', when: 'Yesterday' }
        ]
      },
      {
        id: 'clients',
        title: 'Client Management',
        description: 'Every client, its assigned account manager, and MSA coverage.',
        actions: [{ label: 'Add Client', target: 'clientAdd', primary: true }],
        table: {
          title: 'All clients',
          total: 3,
          headers: ['Client', 'Region', 'Account Manager', 'MSA Expiry', 'Client invoice status', 'Actions'],
          rows: [
            [sub('Persistent', 'USD · America/Chicago'), 'Central', 'Alicia Ross, Priya Natarajan', `Dec 9, 2026 ${b('Expiring Soon')}`, `${b('In Progress')} <span class="person-sub inline">2 of 5</span>`, `<div class="row-actions"><button class="link-btn" data-target="clientView">View</button><button class="link-btn" data-target="clientEdit">Edit</button>${clientInvoiceAction('Persistent')}</div>`],
            [sub('HTC', 'USD · America/New_York'), 'US-East', 'Alicia Ross', 'Feb 12, 2027', b('Uploaded'), `<div class="row-actions"><button class="link-btn" data-target="clientView">View</button><button class="link-btn" data-target="clientEdit">Edit</button>${clientInvoiceAction('HTC')}</div>`],
            [sub('Citus Tech', 'USD · America/Los_Angeles'), 'US-West', 'Benjamin Cole, Alicia Ross', 'Jan 30, 2028', b('Pending'), `<div class="row-actions"><button class="link-btn" data-target="clientView">View</button><button class="link-btn" data-target="clientEdit">Edit</button>${clientInvoiceAction('Citus Tech')}</div>`]
          ]
        }
      },
      {
        id: 'clientAdd',
        parent: 'clients',
        title: 'Add Client',
        description: 'Create a client, assign one or more account managers and upload the MSA.',
        form: {
          sections: [
            {
              title: 'Client details',
              fields: [
                { label: 'Client name', placeholder: 'Enter client name', required: true },
                { label: 'Billing email', placeholder: 'name@company.com', required: true },
                { label: 'Address', placeholder: 'Street, city, state, ZIP', full: true },
                { label: 'Currency', type: 'select', options: ['USD — US Dollar', 'CAD — Canadian Dollar'] },
                { label: 'Time zone', type: 'select', options: ['America/Chicago (CST)', 'America/New_York (EST)', 'America/Los_Angeles (PST)'] },
                { label: 'Account manager', type: 'select', options: ['Alicia Ross', 'Benjamin Cole', 'Priya Natarajan'], required: true }
              ]
            },
            {
              title: 'Master Services Agreement',
              fields: [
                { label: 'MSA start date', type: 'date', required: true },
                { label: 'MSA end date', type: 'date', required: true },
                { label: 'MSA document', type: 'upload', full: true },
                { label: 'Other documents', type: 'extraDocs', full: true, validity: true }
              ]
            }
          ],
          submit: { label: 'Save Client', target: 'clients' },
          cancel: { label: 'Cancel', target: 'clients' }
        }
      },
      {
        id: 'clientEdit',
        parent: 'clients',
        title: 'Edit Client',
        description: 'Review and update the client profile, account assignment and MSA.',
        form: {
          sections: [
            {
              title: 'Client details',
              fields: [
                { label: 'Client name', value: 'Persistent', required: true },
                { label: 'Billing email', value: 'accounts.payable@persistent.example', required: true },
                { label: 'Address', value: '200 N LaSalle St, Suite 1400, Chicago, IL 60601', full: true },
                { label: 'Currency', type: 'select', options: ['USD — US Dollar', 'CAD — Canadian Dollar'] },
                { label: 'Time zone', type: 'select', options: ['America/Chicago (CST)', 'America/New_York (EST)', 'America/Los_Angeles (PST)'] },
                { label: 'Account manager', type: 'select', options: ['Alicia Ross', 'Benjamin Cole', 'Priya Natarajan'], required: true }
              ]
            },
            {
              title: 'Master Services Agreement',
              fields: [
                { label: 'MSA start date', type: 'date', value: '2026-12-01', required: true },
                { label: 'MSA end date', type: 'date', value: '2028-11-30', required: true },
                { label: 'MSA document', type: 'upload', full: true, file: 'Persistent_MSA_signed.pdf', size: '1.8 MB' },
                { label: 'Other documents', type: 'extraDocs', full: true, validity: true }
              ]
            }
          ],
          submit: { label: 'Save Client', target: 'clients' },
          cancel: { label: 'Cancel', target: 'clients' },
          delete: { label: 'Delete Client', target: 'clients' }
        }
      },
      {
        id: 'invoiceUpload',
        title: 'Invoice Management',
        description: 'Review each person’s client invoice against the vendor invoice, resource invoice or timesheet, then approve or reject. A record stays In Progress while either document is missing.',
        // Tabs, filters and rows are built by invoiceManagementScreen().
        typeTabs: true,
        table: { title: 'Vendor Consultants', headers: [], rows: [] }
      },
      {
        id: 'vendors',
        title: 'Vendor Management',
        description: 'All vendors, their account manager and onboarding document status.',
        actions: [{ label: 'Add Vendor', target: 'vendorAdd', primary: true }],
        table: {
          title: 'All vendors',
          total: 84,
          headers: ['Vendor', 'Account Manager', 'Consultants', 'Status', 'Actions'],
          rows: [
            [sub('Coral Staffing LLC', 'Austin, TX'), 'Alicia Ross', '12', b('Active'), `<div class="row-actions"><button class="link-btn" data-target="vendorView">View</button><button class="link-btn" data-target="vendorEdit">Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`],
            [sub('Ridgeline Talent Group', 'Charlotte, NC'), 'Benjamin Cole', '4', b('Onboarding'), `<div class="row-actions"><button class="link-btn" data-target="vendorView">View</button><button class="link-btn" data-target="vendorEdit">Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`],
            [sub('BluePeak Consulting Inc.', 'Denver, CO'), 'Benjamin Cole', '8', b('Active'), `<div class="row-actions"><button class="link-btn" data-target="vendorView">View</button><button class="link-btn" data-target="vendorEdit">Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`],
            [sub('Summit IT Solutions', 'Edison, NJ'), 'Alicia Ross', '19', b('Active'), `<div class="row-actions"><button class="link-btn" data-target="vendorView">View</button><button class="link-btn" data-target="vendorEdit">Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`],
            [sub('Keystone Tech Partners', 'Pittsburgh, PA'), 'Priya Natarajan', '0', b('Invited'), `<div class="row-actions"><button class="link-btn" data-target="vendorView">View</button><button class="link-btn" data-target="vendorEdit">Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`],
            [sub('Orbit Systems Group', 'San Jose, CA'), 'Priya Natarajan', '6', b('Inactive'), `<div class="row-actions"><button class="link-btn" data-target="vendorView">View</button><button class="link-btn" data-target="vendorEdit">Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`]
          ]
        }
      },
      {
        id: 'vendorEdit',
        parent: 'vendors',
        title: 'Edit Vendor',
        description: 'Update vendor profile details and the vendor’s account manager.',
        form: {
          sections: [
            {
              title: 'Company',
              fields: [
                { label: 'Vendor name', value: 'Coral Staffing LLC', readonly: true, lock: 'Admin-managed' },
                { label: 'Federal ID (EIN)', value: '74-3029118', readonly: true, lock: 'Admin-managed' },
                { label: 'Email', value: 'ap@coralstaffing.com', readonly: true, lock: 'Admin-managed' },
                { label: 'State of incorporation', value: 'Texas', readonly: true, lock: 'Admin-managed' },
                { label: 'Address', value: '401 Congress Ave, Suite 1540, Austin, TX 78701', full: true },
                { label: 'Phone', value: '(512) 555-0136' },
                { label: 'Account manager', type: 'select', options: ['Alicia Ross', 'Benjamin Cole', 'Priya Natarajan'], required: true },
                { label: 'Payment term', type: 'select', options: ['Net 10', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Immediate', 'Custom'], customInput: true, required: true, note: 'Applies to every consultant of this vendor. The vendor cannot change it.' }
              ]
            },
            {
              title: 'Authorized signatory',
              fields: [
                { label: 'Name', value: 'Daniel Ortiz' },
                { label: 'Phone', value: '(512) 555-0161' }
              ]
            }
          ],
          submit: { label: 'Save Changes', target: 'vendors' },
          cancel: { label: 'Cancel', target: 'vendors' }
        }
      },
      {
        id: 'vendorInvoices',
        parent: 'vendors',
        title: 'Vendor Invoices',
        description: 'Lists of invoices submitted by the selected vendor for reconciliation and payment review.',
        table: {
          title: 'Coral Staffing LLC · Invoices',
          total: 12,
          headers: ['Invoice #', 'Consultant', 'Client', 'Hours', 'Amount', 'Submitted', 'Status', 'Actions'],
          rows: [
            [mono('INV-2026-10-0203'), person('Deepa Kumar'), 'Persistent', '160', '$12,800.00', 'Nov 3, 2026', b('Rejected'), '<div class="row-actions"><button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0203">View</button><button class="link-btn" data-target="rejectedInvoice">Correct</button></div>'],
            [mono('INV-2026-10-0142'), person('Rinaldo Silva'), 'Citus Tech', '168', '$12,096.00', 'Nov 4, 2026 (v2)', b('Approved'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0142">View</button>'],
            [mono('INV-2026-10-0198'), person('Omar Haddad'), 'Persistent', '144', '$12,096.00', 'Nov 3, 2026', b('In Progress'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0198">View</button>'],
            [mono('INV-2026-10-0176'), person('Sofia Marin'), 'Citus Tech', '168', '$12,768.00', 'Nov 2, 2026', b('In Progress'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0176">View</button>']
          ]
        }
      },
      {
        id: 'vendorConsultants',
        parent: 'vendors',
        title: 'Vendor Consultants',
        description: 'Consultants associated with the selected vendor and their current client assignments.',
        table: {
          title: 'Coral Staffing consultants',
          total: 12,
          headers: ['Consultant', 'Client', 'Hourly Rate', 'Assignment Period', 'Location', 'Status', 'Actions'],
          rows: [
            [person('Deepa Kumar', 'Business Analyst'), 'Persistent', '$80.00', 'Jan 12, 2026 – Dec 31, 2026', 'Boston, MA', b('Active'), consultantActions('Deepa Kumar')],
            [person('Rinaldo Silva', 'QA Engineer'), 'Citus Tech', '$72.00', 'Sep 14, 2026 – Mar 12, 2027', 'Remote', b('Active'), consultantActions('Rinaldo Silva')],
            [person('Omar Haddad', 'DevOps Engineer'), 'Persistent', '$84.00', 'Feb 2, 2026 – Jan 29, 2027', 'Chicago, IL', b('Active'), consultantActions('Omar Haddad')],
            [person('Sofia Marin', 'Scrum Master'), 'Citus Tech', '$76.00', 'May 4, 2026 – Nov 27, 2026', 'Remote', b('Active'), consultantActions('Sofia Marin')],
            [person('Priya Shah', 'Data Engineer'), 'Citus Tech', '$88.00', 'Nov 16, 2026 – May 14, 2027', 'Remote', b('Onboarding'), consultantActions('Priya Shah')],
            [person('Marcus Lee', 'Salesforce Developer'), NOT_MAPPED, '$92.00', 'Dec 7, 2026 – Jun 4, 2027', 'San Francisco, CA', b('Onboarding'), consultantActions('Marcus Lee')]
          ]
        }
      },
      {
        id: 'vendorAdd',
        parent: 'vendors',
        title: 'Add Vendor',
        description: 'Create the vendor record. A single-use magic link (valid 72 h) is emailed on save.',
        form: {
          sections: [
            {
              title: 'Vendor details',
              fields: [
                { label: 'Name', value: 'Harborview Staffing LLC', required: true },
                { label: 'Address', value: '75 State St, Floor 9, Boston, MA 02109', full: true, required: true },
                { label: 'Email', value: 'contracts@harborviewstaffing.com', required: true },
                { label: 'Federal ID (EIN)', value: '47-2810356', required: true },
                { label: 'Phone', value: '(617) 555-0142', required: true },
                { label: 'State of incorporation', type: 'select', options: ['Massachusetts', 'Delaware', 'New York'], required: true },
                { label: 'Authorized signatory name', value: 'Rachel Moreno', required: true },
                { label: 'Account manager', type: 'select', options: ['Alicia Ross', 'Benjamin Cole', 'Priya Natarajan'], required: true },
                { label: 'Payment term', type: 'select', options: ['Net 10', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Immediate', 'Custom'], customInput: true, required: true, note: 'Applies to every consultant of this vendor. The vendor cannot change it.' }
              ]
            },
            {
              title: 'Documents uploaded by the account manager',
              hint: 'PDF, DOCX, JPG or PNG · max 5 MB. Enter the start and end date of each. Documents not uploaded now are marked Incomplete in the Document Tracker.',
              fields: [
                { label: 'MSA', type: 'upload', validity: true, start: '2026-11-15', end: '2028-11-14', file: 'Harborview_MSA.pdf', size: '2.1 MB' },
                { label: 'PO', type: 'upload', validity: true, start: '2026-11-15', end: '2027-05-14', file: 'PO-44120.pdf', size: '340 KB' },
                { label: 'Other documents', type: 'extraDocs', full: true, validity: true }
              ]
            },
            {
              title: 'Documents uploaded by the vendor',
              hint: 'The vendor uploads these after signing in with the magic link. Until then they show as Incomplete.',
              fields: [
                { label: 'W-9 (start / end date)', type: 'upload', byOther: 'Uploaded by the vendor, with start and end date.', readonly: true, lock: 'Vendor uploads' },
                { label: 'COI (start / end date)', type: 'upload', byOther: 'Uploaded by the vendor, with start and end date.', readonly: true, lock: 'Vendor uploads' },
                { label: 'ACH form', type: 'upload', byOther: 'Uploaded by the vendor.', readonly: true, lock: 'Vendor uploads' }
              ]
            }
          ],
          submit: { label: 'Save & Send Invite', target: 'vendors' },
          cancel: { label: 'Cancel', target: 'vendors' }
        }
      },
      {
        id: 'teamMembers',
        title: 'Team Members',
        description: 'Vendor consultants plus in-house W-2 and 1099 resources. Each person works for one client and submits one invoice or timesheet per month.',
        actions: [{ label: 'Add Resource', target: 'resourceAdd', primary: true }],
        table: {
          title: 'All team members',
          total: 707,
          headers: ['Name', 'Type', 'Client', 'Hourly Rate', 'Assignment Period', 'Status', 'Actions'],
          rows: [
            [person('Maya Reed', 'Data Analyst'), 'W-2', 'HTC', '$62.00', 'Mar 2, 2026 – Feb 26, 2027', b('Active'), memberAction('Maya Reed', true)],
            [person('Jordan Blake', 'UX Consultant'), '1099', 'HTC', '$90.00', 'Jul 6, 2026 – Jan 8, 2027', b('Active'), memberAction('Jordan Blake', true)],
            [person('Deepa Kumar', 'Business Analyst · Coral Staffing'), 'Consultant', 'Persistent', '$80.00', 'Jan 12, 2026 – Dec 31, 2026', b('Active'), memberAction('Deepa Kumar', true)],
            [person('Rinaldo Silva', 'QA Engineer · Coral Staffing'), 'Consultant', 'Citus Tech', '$72.00', 'Sep 14, 2026 – Mar 12, 2027', b('Active'), memberAction('Rinaldo Silva', true)],
            [person('Kevin Singh', 'Java Developer · Summit IT'), 'Consultant', 'Persistent', '$85.00', 'Apr 1, 2026 – Mar 31, 2027', b('Active'), memberAction('Kevin Singh', true)],
            [person('Priya Shah', 'Data Engineer · Coral Staffing'), 'Consultant', 'Citus Tech', '$88.00', 'Nov 16, 2026 – May 14, 2027', b('Onboarding'), memberAction('Priya Shah', true)],
            [person('Marcus Lee', 'Salesforce Developer · Coral Staffing'), 'Consultant', NOT_MAPPED, '$92.00', 'Dec 7, 2026 – Jun 4, 2027', b('Onboarding'), memberAction('Marcus Lee', false)]
          ]
        }
      },
      {
        id: 'resourceAdd',
        parent: 'teamMembers',
        title: 'Add Resource',
        description: 'Add a W-2 or 1099 resource with personal, assignment and payment details.',
        form: {
          sections: [
            {
              title: 'Resource type',
              fields: [{ type: 'segmented', full: true, options: ['W-2 Employee', '1099 Contractor'], selected: 0 }]
            },
            {
              title: 'Personal details',
              fields: [
                { label: 'Full name', value: 'Samuel Okafor', required: true },
                { label: 'SSN', value: '•••-••-4417', required: true },
                { label: 'Email', value: 'samuel.okafor@gmail.com', required: true },
                { label: 'Phone', value: '(312) 555-0173' },
                { label: 'Address', value: '1840 W Division St, Apt 3R, Chicago, IL 60622', full: true }
              ]
            },
            {
              title: 'Assignment',
              fields: [
                { label: 'Client', type: 'select', options: CLIENT_NAMES },
                { label: 'Role', value: 'Cloud Engineer' },
                { label: 'Hourly rate (USD)', value: '68.00' },
                { label: 'Work location', type: 'select', options: ['Hybrid — Chicago, IL', 'Remote', 'Onsite'] },
                { label: 'Start date', type: 'date', value: '2026-12-01' },
                { label: 'End date', type: 'date', value: '2027-11-30' },
                { label: 'Payment term', type: 'select', options: ['Net 10', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Immediate', 'Custom'], customInput: true },
                // Duration is typed in, not auto-filled (W-2 and 1099 alike).
                { label: 'Duration', placeholder: 'e.g. 12 months' }
              ]
            },
            {
              title: 'W-2 documents uploaded by the account manager',
              showFor: 'W-2 Employee',
              hint: 'Payslips accepts several files. Every document except ACH, audit report and payslips has a start and end date. Anything not uploaded now is marked Incomplete in the Document Tracker.',
              fields: [
                { label: 'Employment contract', type: 'upload', validity: true },
                { label: 'W-2 (year end)', type: 'upload', validity: true },
                { label: 'Payslips', type: 'upload', multiple: true },
                { label: 'Audit report', type: 'upload', byOther: 'Uploaded later by the account manager, not during onboarding. A new report is uploaded for each 3- or 6-month period; only the latest is shown.', readonly: true, lock: 'Later' },
                { label: 'Other documents', type: 'extraDocs', full: true, validity: true }
              ]
            },
            {
              title: 'W-2 documents uploaded by the resource',
              showFor: 'W-2 Employee',
              hint: 'The resource uploads these after signing in. Until then they show as Incomplete.',
              fields: [
                { label: 'W-4', type: 'upload', byOther: 'Uploaded by the W-2 resource, with start and end date.', readonly: true, lock: 'Resource uploads' },
                { label: 'I-9', type: 'upload', byOther: 'Uploaded by the W-2 resource, with start and end date.', readonly: true, lock: 'Resource uploads' },
                { label: 'ACH form', type: 'upload', byOther: 'Uploaded by the W-2 resource.', readonly: true, lock: 'Resource uploads' }
              ]
            },
            // 1099 mirrors the W-2 layout: 1099 contract ↔ employment contract, 1099 year end ↔ payslips, W-9 ↔ W-4.
            {
              title: '1099 documents uploaded by the account manager',
              showFor: '1099 Contractor',
              hint: 'Every document except ACH and audit report has a start and end date. Anything not uploaded now is marked Incomplete in the Document Tracker.',
              fields: [
                { label: '1099 contract', type: 'upload', validity: true },
                { label: '1099 (year end)', type: 'upload', validity: true },
                { label: 'Audit report', type: 'upload', byOther: 'Uploaded later by the account manager, not during onboarding. A new report is uploaded for each 3- or 6-month period; only the latest is shown.', readonly: true, lock: 'Later' },
                { label: 'Other documents', type: 'extraDocs', full: true, validity: true }
              ]
            },
            {
              title: '1099 documents uploaded by the resource',
              showFor: '1099 Contractor',
              hint: 'The resource uploads these after signing in. Until then they show as Incomplete.',
              fields: [
                { label: 'W-9', type: 'upload', byOther: 'Uploaded by the 1099 resource, with start and end date.', readonly: true, lock: 'Resource uploads' },
                { label: 'I-9', type: 'upload', byOther: 'Uploaded by the 1099 resource, with start and end date.', readonly: true, lock: 'Resource uploads' },
                { label: 'ACH form', type: 'upload', byOther: 'Uploaded by the 1099 resource.', readonly: true, lock: 'Resource uploads' }
              ]
            }
          ],
          submit: { label: 'Save & Send Invite', target: 'teamMembers' },
          cancel: { label: 'Cancel', target: 'teamMembers' }
        }
      },
      {
        id: 'documentTracker',
        title: 'Document Tracker',
        description: 'Every client, vendor, consultant and resource document. Owners and AMs are alerted 30 days before expiry.',
        tabs: ['All (2,184)', 'Expiring Soon (20)', 'Expired (3)', 'Incomplete (41)'],
        table: {
          title: 'Documents',
          total: 2184,
          headers: ['Document', 'Owner', 'Owner Type', 'Version', 'Expires', 'Status', 'Actions'],
          rows: [
            ['MSA', 'HTC', 'Client', 'v3', 'Feb 12, 2027', b('Valid'), acts('View')],
            ['COI', 'Coral Staffing LLC', 'Vendor', 'v2', 'Nov 25, 2026', b('Expiring Soon'), acts('View', 'Remind')],
            ['Work authorization (H-1B)', 'Deepa Kumar', 'Consultant', 'v1', 'Nov 30, 2026', b('Expiring Soon'), acts('View', 'Remind')],
            ['I-9', 'Maya Reed', 'W-2 Resource', '—', '—', b('Incomplete'), acts('Request')],
            ['E-Verify', 'Ana Torres', 'Consultant', '—', '—', b('Not Applicable'), acts('View')]
          ]
        }
      },
      {
        id: 'audit',
        title: 'Audit Log',
        description: 'Immutable record of every create, update, delete, upload, login and status change. Tax documents retained 7 years.',
        actions: [{ label: 'Export', target: 'audit' }],
        table: {
          title: 'Today — Nov 10, 2026',
          total: 1316,
          headers: ['Time', 'User', 'Action', 'Record', 'Before → After'],
          rows: [
            ['10:12 AM', person('Arun Krishnan', 'Super Admin'), 'Updated client', 'Citus Tech', `MSA end: Jan 30, 2027 → <b>Jan 30, 2028</b>`],
            ['09:58 AM', person('Alicia Ross', 'Account Manager'), 'Uploaded client invoice', 'Persistent · Oct 2026', '— → PER-Oct26-Singh.pdf, PER-Oct26-Kumar.pdf'],
            ['09:58 AM', person('System', 'Reconciliation'), 'Status change', 'INV-2026-10-0187', `In Progress → ${b('Rejected')}`],
            ['09:31 AM', person('Daniel Ortiz', 'Vendor · Coral Staffing'), 'Created consultant', 'Priya Shah', '— → Data Engineer, $88.00/hr'],
            ['09:05 AM', person('Priya Natarajan', 'Account Manager'), 'Changed vendor status', 'Orbit Systems Group', `${b('Active')} → ${b('Inactive')}`],
            ['08:47 AM', person('Jordan Blake', '1099 Resource'), 'Login (OTP verified)', 'Session', '—']
          ]
        }
      }
    ]
  },

  /* =============================================================== */
  accountmanager: {
    name: 'Account Manager',
    user: { name: 'Alicia Ross', role: 'Account Manager', email: 'a.ross@arkhyatech.com' },
    notifications: 4,
    nav: [
      { label: 'Dashboard', target: 'dashboard' },
      { label: 'My Clients', target: 'clients' },
      { label: 'My Vendors', target: 'vendorList' },
      { label: 'Team Members', target: 'teamMembers' },
      { label: 'Invoice Management', target: 'invoiceUpload' },
      { label: 'Document Tracker', target: 'docs' },
      { label: 'Audit Log', target: 'auditLog' }
    ],
    screens: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Your 3 clients and 18 vendors. October 2026 billing closes Nov 15, 2026.',
        kpis: [
          { label: 'Assigned clients', value: '3', trend: 'Persistent · HTC · Citus Tech', tone: 'neutral' },
          { label: 'Vendors in scope', value: '18', trend: '2 onboarding', tone: 'neutral' },
          { label: 'Awaiting client invoice', value: '9', trend: '2 clients outstanding', tone: 'warn' },
          { label: 'Rejected this cycle', value: '4', trend: '−3 vs. September', tone: 'up' }
        ],
        panels: [
          {
            title: 'Needs your attention',
            chip: '3 tasks',
            items: [
              { label: sub('Finish Oct client invoices — Persistent', '3 of 5 people still waiting'), value: b('Due'), meta: 'Nov 12, 2026' },
              { label: sub('Upload Oct client invoice — Citus Tech', '4 submissions waiting on it'), value: b('Due'), meta: 'Nov 12, 2026' },
              { label: sub('COI expiring — Coral Staffing LLC', 'Vendor notified Oct 26, 2026'), value: b('Expiring Soon'), meta: 'Nov 25, 2026' }
            ]
          },
          {
            title: 'October invoice review',
            chip: '64 submissions',
            bars: [
              { label: 'Approved', value: 51, pct: 80, tone: 'approved', target: 'invoiceUpload', status: 'Approved' },
              { label: 'In Progress (a document missing or awaiting review)', value: 9, pct: 14, tone: 'progress', target: 'invoiceUpload', status: 'In Progress' },
              { label: 'Rejected', value: 4, pct: 6, tone: 'rejected', target: 'invoiceUpload', status: 'Rejected' }
            ]
          }
        ],
        activity: [
          { who: 'Alicia Ross', what: 'rejected <b>INV-2026-10-0187</b> (Kevin Singh, Persistent) — 160 h submitted vs. 152 h on client invoice', when: '12 min ago' },
          { who: 'Alicia Ross', what: 'uploaded Persistent client invoices for Kevin Singh and Deepa Kumar', when: '12 min ago' },
          { who: 'Daniel Ortiz', what: 'resubmitted <b>INV-2026-10-0142</b> (Rinaldo Silva) — now Approved', when: '1 hr ago' },
          { who: 'Maya Reed', what: 'submitted October timesheet (168 h)', when: 'Yesterday' }
        ]
      },
      {
        id: 'clients',
        title: 'My Clients',
        description: 'Clients assigned to you and the people working on each.',
        table: {
          title: 'Assigned clients',
          total: 3,
          headers: ['Client', 'Region', 'Vendors', 'People', 'MSA Expiry', 'Client invoice status', 'Actions'],
          rows: [
            [sub('Persistent', 'America/Chicago'), 'Central', '2', '5', `Dec 9, 2026 ${b('Expiring Soon')}`, `${b('In Progress')} <span class="person-sub inline">2 of 5</span>`, `<div class="row-actions"><button class="link-btn" data-target="clientView">View</button><button class="link-btn" data-target="clientEdit">Edit</button>${clientInvoiceAction('Persistent')}</div>`],
            [sub('HTC', 'America/New_York'), 'US-East', '3', '5', 'Feb 12, 2027', b('Uploaded'), `<div class="row-actions"><button class="link-btn" data-target="clientView">View</button><button class="link-btn" data-target="clientEdit">Edit</button>${clientInvoiceAction('HTC')}</div>`],
            [sub('Citus Tech', 'America/Los_Angeles'), 'US-West', '1', '2', 'Jan 30, 2028', b('Pending'), `<div class="row-actions"><button class="link-btn" data-target="clientView">View</button><button class="link-btn" data-target="clientEdit">Edit</button>${clientInvoiceAction('Citus Tech')}</div>`]
          ]
        }
      },
      {
        id: 'vendorList',
        title: 'My Vendors',
        description: 'Vendors assigned to you. You can onboard new vendors and update their details.',
        actions: [{ label: 'Add Vendor', target: 'vendorAdd', primary: true }],
        table: {
          title: 'Assigned vendors',
          total: 18,
          headers: ['Vendor', 'Primary Contact', 'Consultants', 'Clients', 'Status', 'Actions'],
          rows: [
            [sub('Coral Staffing LLC', 'Austin, TX'), sub('Daniel Ortiz', 'd.ortiz@coralstaffing.com'), '12', 'Persistent, Citus Tech', b('Active'), `<div class="row-actions"><button class="link-btn" data-target="vendorView">View</button><button class="link-btn" data-target="vendorEdit">Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`],
            [sub('Summit IT Solutions', 'Edison, NJ'), sub('Ravi Menon', 'ravi@summitits.com'), '19', 'Persistent, HTC', b('Active'), `<div class="row-actions"><button class="link-btn" data-target="vendorView">View</button><button class="link-btn" data-target="vendorEdit">Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`],
            [sub('Ridgeline Talent Group', 'Charlotte, NC'), sub('Megan Price', 'mprice@ridgelinetalent.com'), '4', 'HTC', b('Onboarding'), `<div class="row-actions"><button class="link-btn" data-target="vendorView">View</button><button class="link-btn" data-target="vendorEdit">Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`],
            [sub('Cascade Data Partners', 'Seattle, WA'), sub('Tom Hughes', 'tom@cascadedata.io'), '2', 'HTC', b('Active'), `<div class="row-actions"><button class="link-btn" data-target="vendorView">View</button><button class="link-btn" data-target="vendorEdit">Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`]
          ]
        }
      },
      {
        id: 'vendorEdit',
        parent: 'vendorList',
        title: 'Edit Vendor',
        description: 'Update vendor profile details and the vendor’s account manager.',
        form: {
          sections: [
            {
              title: 'Company',
              fields: [
                { label: 'Vendor name', value: 'Coral Staffing LLC', readonly: true, lock: 'Admin-managed' },
                { label: 'Federal ID (EIN)', value: '74-3029118', readonly: true, lock: 'Admin-managed' },
                { label: 'Email', value: 'ap@coralstaffing.com', readonly: true, lock: 'Admin-managed' },
                { label: 'State of incorporation', value: 'Texas', readonly: true, lock: 'Admin-managed' },
                { label: 'Address', value: '401 Congress Ave, Suite 1540, Austin, TX 78701', full: true },
                { label: 'Phone', value: '(512) 555-0136' },
                { label: 'Account manager', type: 'select', options: ['Alicia Ross', 'Benjamin Cole', 'Priya Natarajan'], required: true },
                { label: 'Payment term', type: 'select', options: ['Net 10', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Immediate', 'Custom'], customInput: true, required: true, note: 'Applies to every consultant of this vendor. The vendor cannot change it.' }
              ]
            },
            {
              title: 'Authorized signatory',
              fields: [
                { label: 'Name', value: 'Daniel Ortiz' },
                { label: 'Phone', value: '(512) 555-0161' }
              ]
            }
          ],
          submit: { label: 'Save Changes', target: 'vendorList' },
          cancel: { label: 'Cancel', target: 'vendorList' }
        }
      },
      {
        id: 'vendorInvoices',
        parent: 'vendorList',
        title: 'Vendor Invoices',
        description: 'Lists of invoices submitted by the selected vendor for reconciliation and payment review.',
        table: {
          title: 'Coral Staffing LLC · Invoices',
          total: 12,
          headers: ['Invoice #', 'Consultant', 'Client', 'Hours', 'Amount', 'Submitted', 'Status', 'Actions'],
          rows: [
            [mono('INV-2026-10-0203'), person('Deepa Kumar'), 'Persistent', '160', '$12,800.00', 'Nov 3, 2026', b('Rejected'), '<div class="row-actions"><button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0203">View</button><button class="link-btn" data-target="rejectedInvoice">Correct</button></div>'],
            [mono('INV-2026-10-0142'), person('Rinaldo Silva'), 'Citus Tech', '168', '$12,096.00', 'Nov 4, 2026 (v2)', b('Approved'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0142">View</button>'],
            [mono('INV-2026-10-0198'), person('Omar Haddad'), 'Persistent', '144', '$12,096.00', 'Nov 3, 2026', b('In Progress'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0198">View</button>'],
            [mono('INV-2026-10-0176'), person('Sofia Marin'), 'Citus Tech', '168', '$12,768.00', 'Nov 2, 2026', b('In Progress'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0176">View</button>']
          ]
        }
      },
      {
        id: 'vendorConsultants',
        parent: 'vendorList',
        title: 'Vendor Consultants',
        description: 'Consultants associated with the selected vendor and their current client assignments.',
        actions: [{ label: 'Add Consultant', target: 'consultantAdd', primary: true }],
        table: {
          title: 'Coral Staffing consultants',
          total: 12,
          headers: ['Consultant', 'Client', 'Hourly Rate', 'Assignment Period', 'Location', 'Status', 'Actions'],
          rows: [
            [person('Deepa Kumar', 'Business Analyst'), 'Persistent', '$80.00', 'Jan 12, 2026 – Dec 31, 2026', 'Boston, MA', b('Active'), consultantActions('Deepa Kumar')],
            [person('Rinaldo Silva', 'QA Engineer'), 'Citus Tech', '$72.00', 'Sep 14, 2026 – Mar 12, 2027', 'Remote', b('Active'), consultantActions('Rinaldo Silva')],
            [person('Omar Haddad', 'DevOps Engineer'), 'Persistent', '$84.00', 'Feb 2, 2026 – Jan 29, 2027', 'Chicago, IL', b('Active'), consultantActions('Omar Haddad')],
            [person('Sofia Marin', 'Scrum Master'), 'Citus Tech', '$76.00', 'May 4, 2026 – Nov 27, 2026', 'Remote', b('Active'), consultantActions('Sofia Marin')],
            [person('Priya Shah', 'Data Engineer'), 'Citus Tech', '$88.00', 'Nov 16, 2026 – May 14, 2027', 'Remote', b('Onboarding'), consultantActions('Priya Shah')],
            [person('Marcus Lee', 'Salesforce Developer'), NOT_MAPPED, '$92.00', 'Dec 7, 2026 – Jun 4, 2027', 'San Francisco, CA', b('Onboarding'), consultantActions('Marcus Lee')]
          ]
        }
      },
      {
        id: 'consultantAdd',
        parent: 'vendorConsultants',
        title: 'Add Consultant',
        description: 'Add a consultant and their first client assignment.',
        form: {
          sections: [
            {
              title: 'Consultant & assignment',
              fields: [
                { label: 'Consultant name', value: 'Marcus Lee', required: true },
                { label: 'Role', value: 'Salesforce Developer', required: true },
                { label: 'Client', type: 'select', options: CLIENT_NAMES, required: true },
                { label: 'Hourly rate (USD)', value: '92.00', required: true },
                { label: 'Start date', type: 'date', value: '2026-12-07' },
                { label: 'End date', type: 'date', value: '2027-06-04' },
                { label: 'Duration', value: '26 weeks', readonly: true },
                { label: 'Payment term', value: vendorPaymentTerm('Coral Staffing LLC'), readonly: true, lock: 'From vendor · set by account manager' },
                { label: 'Work location', type: 'select', options: ['Remote', 'Location'], addOption: { trigger: 'Location', placeholder: 'Enter location name, e.g. San Francisco, CA' } }
              ]
            },
            {
              title: 'Documents',
              hint: 'PDF, DOCX, JPG or PNG · max 5 MB each. Missing documents can be added later.',
              fields: [
                { label: 'Resume', type: 'upload', validity: true, file: 'Marcus_Lee_Resume.pdf', size: '186 KB' },
                { label: 'Work authorization', type: 'upload', validity: true, file: 'Lee_EAD_2026.pdf', size: '1.2 MB' },
                { label: 'I-9 audit report', type: 'upload', auditPeriod: true },
                { label: 'E-Verify document', type: 'upload', validity: true },
                { label: 'Other documents', type: 'extraDocs', full: true, validity: true }
              ]
            }
          ],
          submit: { label: 'Save Consultant', target: 'vendorConsultants' },
          cancel: { label: 'Cancel', target: 'vendorConsultants' }
        }
      },
      {
        id: 'teamMembers',
        title: 'Team Members',
        description: 'Consultants and resources working on your clients.',
        actions: [{ label: 'Add Resource', target: 'resourceAdd', primary: true }],
        table: {
          title: 'People on your clients',
          total: 23,
          headers: ['Name', 'Type', 'Client', 'Hourly Rate', 'Oct Submission', 'Status', 'Actions'],
          rows: [
            [person('Maya Reed', 'Data Analyst'), 'W-2', 'HTC', '$62.00', b('Approved'), b('Active'), memberAction('Maya Reed', true)],
            [person('Jordan Blake', 'UX Consultant'), '1099', 'HTC', '$90.00', b('In Progress'), b('Active'), memberAction('Jordan Blake', true)],
            [person('Deepa Kumar', 'Business Analyst · Coral Staffing'), 'Consultant', 'Persistent', '$80.00', b('Rejected'), b('Active'), memberAction('Deepa Kumar', true)],
            [person('Kevin Singh', 'Java Developer · Summit IT'), 'Consultant', 'Persistent', '$85.00', b('Rejected'), b('Active'), memberAction('Kevin Singh', true)],
            [person('Priya Shah', 'Data Engineer · Coral Staffing'), 'Consultant', 'Citus Tech', '$88.00', b('Not Started'), b('Onboarding'), memberAction('Priya Shah', true)],
            // Added by the vendor; this account manager has not mapped a client yet.
            [person('Marcus Lee', 'Salesforce Developer · Coral Staffing'), 'Consultant', NOT_MAPPED, '$92.00', b('Not Started'), b('Onboarding'), memberAction('Marcus Lee', false)]
          ]
        }
      },
      {
        id: 'invoiceUpload',
        title: 'Invoice Management',
        description: 'Review each person’s client invoice against the vendor invoice, resource invoice or timesheet, then approve or reject. A record stays In Progress while either document is missing.',
        // Tabs, filters and rows are built by invoiceManagementScreen().
        typeTabs: true,
        table: { title: 'Vendor Consultants', headers: [], rows: [] }
      },
      {
        id: 'docs',
        title: 'Document Tracker',
        description: 'Documents for your clients, vendors and people.',
        tabs: ['All (318)', 'Expiring Soon (6)', 'Expired (0)', 'Incomplete (11)'],
        table: {
          title: 'Documents',
          total: 318,
          headers: ['Document', 'Owner', 'Owner Type', 'Expires', 'Status', 'Actions'],
          rows: [
            ['COI', 'Coral Staffing LLC', 'Vendor', 'Nov 25, 2026', b('Expiring Soon'), acts('View', 'Remind')],
            ['Work authorization (H-1B)', 'Deepa Kumar', 'Consultant', 'Nov 30, 2026', b('Expiring Soon'), acts('View', 'Remind')],
            ['MSA', 'Persistent', 'Client', 'Dec 9, 2026', b('Expiring Soon'), acts('View')],
            ['ACH form', 'Ridgeline Talent Group', 'Vendor', '—', b('Incomplete'), acts('Request')],
            ['W-9', 'Summit IT Solutions', 'Vendor', 'Jul 1, 2027', b('Valid'), acts('View')]
          ]
        }
      },
      {
        id: 'auditLog',
        title: 'Audit Log',
        description: 'Activity on your clients, vendors and people.',
        table: {
          title: 'Today — Nov 10, 2026',
          total: 142,
          headers: ['Time', 'User', 'Action', 'Record', 'Before → After'],
          rows: [
            ['09:58 AM', person('Alicia Ross', 'Account Manager'), 'Uploaded client invoice', 'Persistent · Oct 2026', '— → PER-Oct26-Singh.pdf, PER-Oct26-Kumar.pdf'],
            ['09:58 AM', person('System', 'Reconciliation'), 'Status change', 'INV-2026-10-0187', `In Progress → ${b('Rejected')}`],
            ['09:31 AM', person('Daniel Ortiz', 'Vendor · Coral Staffing'), 'Created consultant', 'Priya Shah', '— → Data Engineer, $88.00/hr'],
            ['08:56 AM', person('Daniel Ortiz', 'Vendor · Coral Staffing'), 'Resubmitted invoice', 'INV-2026-10-0142 (v2)', 'Hours: 160 → <b>168</b>']
          ]
        }
      }
    ]
  },

  /* =============================================================== */
  vendor: {
    name: 'Vendor',
    user: { name: 'Daniel Ortiz', role: 'Coral Staffing LLC', email: 'd.ortiz@coralstaffing.com' },
    notifications: 3,
    nav: [
      { label: 'Dashboard', target: 'dashboard' },
      { label: 'Consultants', target: 'consultants' },
      { label: 'Invoices', target: 'invoices' },
      { label: 'Documents', target: 'docs' },
      { label: 'Company Profile', target: 'profile' }
    ],
    screens: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Coral Staffing LLC · Account manager: Alicia Ross. October 2026 invoices are due Nov 15, 2026.',
        alert: {
          tone: 'danger',
          title: '1 invoice was rejected and needs correction',
          text: 'INV-2026-10-0203 · Deepa Kumar · Persistent — total hours do not match the client invoice.',
          action: { label: 'Fix now', target: 'rejectedInvoice' }
        },
        kpis: [
          { label: 'Active consultants', value: '12', trend: '1 starting Nov 16, 2026', tone: 'neutral' },
          { label: 'Approved — Oct 2026', value: '8', trend: 'of 12 submitted', tone: 'up' },
          { label: 'Rejected to fix', value: '1', trend: 'Action needed', tone: 'down' },
          { label: 'Expiring documents', value: '2', trend: 'Next: COI · Nov 25, 2026', tone: 'warn' }
        ],
        panels: [
          {
            title: 'October 2026 submissions',
            chip: '12 consultants',
            bars: [
              { label: 'Approved', value: 8, pct: 67, tone: 'approved', target: 'invoices', tab: 1 },
              { label: 'Awaiting client invoice', value: 3, pct: 25, tone: 'progress', target: 'invoices', tab: 2 },
              { label: 'Rejected', value: 1, pct: 8, tone: 'rejected', target: 'invoices', tab: 3 }
            ]
          },
          {
            title: 'Documents',
            chip: '4 of 5 valid',
            items: [
              { label: sub('COI', 'Certificate of insurance'), value: b('Expiring Soon'), meta: 'Nov 25, 2026' },
              { label: sub('Work authorization — Deepa Kumar', 'Consultant document'), value: b('Expiring Soon'), meta: 'Nov 30, 2026' },
              { label: sub('MSA', 'Jan 1, 2026 – Dec 31, 2027'), value: b('Valid'), meta: '' },
              { label: sub('W-9', 'Tax year 2026'), value: b('Valid'), meta: '' }
            ]
          }
        ],
        activity: [
          { who: 'Alicia Ross', what: 'rejected <b>INV-2026-10-0203</b> (Deepa Kumar) — 160 h submitted vs. 168 h on client invoice', when: '12 min ago' },
          { who: 'Daniel Ortiz', what: 'added consultant <b>Priya Shah</b>', when: '39 min ago' },
          { who: 'Alicia Ross', what: 'approved <b>INV-2026-10-0142</b> (Rinaldo Silva) after resubmission', when: '1 hr ago' }
        ]
      },
      {
        id: 'consultants',
        title: 'Consultants',
        description: 'Your consultants. Clients are mapped by your account manager.',
        actions: [{ label: 'Add Consultant', target: 'consultantAdd', primary: true }],
        table: {
          title: 'Coral Staffing consultants',
          total: 12,
          // No Client column: the vendor does not choose or manage the client (the account manager maps it).
          headers: ['Consultant', 'Hourly Rate', 'Assignment Period', 'Location', 'Status', 'Actions'],
          rows: [
            [person('Deepa Kumar', 'Business Analyst'), '$80.00', 'Jan 12, 2026 – Dec 31, 2026', 'Boston, MA', b('Active'), consultantActions('Deepa Kumar')],
            [person('Rinaldo Silva', 'QA Engineer'), '$72.00', 'Sep 14, 2026 – Mar 12, 2027', 'Remote', b('Active'), consultantActions('Rinaldo Silva')],
            [person('Omar Haddad', 'DevOps Engineer'), '$84.00', 'Feb 2, 2026 – Jan 29, 2027', 'Chicago, IL', b('Active'), consultantActions('Omar Haddad')],
            [person('Sofia Marin', 'Scrum Master'), '$76.00', 'May 4, 2026 – Nov 27, 2026', 'Remote', b('Active'), consultantActions('Sofia Marin')],
            [person('Priya Shah', 'Data Engineer'), '$88.00', 'Nov 16, 2026 – May 14, 2027', 'Remote', b('Onboarding'), consultantActions('Priya Shah')],
            [person('Marcus Lee', 'Salesforce Developer'), '$92.00', 'Dec 7, 2026 – Jun 4, 2027', 'San Francisco, CA', b('Onboarding'), consultantActions('Marcus Lee')]
          ]
        }
      },
      {
        id: 'consultantAdd',
        parent: 'consultants',
        title: 'Add Consultant',
        description: 'Add a consultant. Your account manager maps them to a client after you save.',
        form: {
          sections: [
            {
              title: 'Consultant & assignment',
              hint: 'The client is not selected here. Your account manager maps the consultant to a client.',
              fields: [
                { label: 'Consultant name', value: 'Marcus Lee', required: true },
                { label: 'Role', value: 'Salesforce Developer', required: true },
                { label: 'Hourly rate (USD)', value: '92.00', required: true },
                { label: 'Start date', type: 'date', value: '2026-12-07' },
                { label: 'End date', type: 'date', value: '2027-06-04' },
                { label: 'Duration', value: '26 weeks', readonly: true },
                { label: 'Payment term', value: vendorPaymentTerm('Coral Staffing LLC'), readonly: true, lock: 'From vendor · set by account manager' },
                { label: 'Work location', type: 'select', options: ['Remote', 'Location'], addOption: { trigger: 'Location', placeholder: 'Enter location name, e.g. San Francisco, CA' } }
              ]
            },
            {
              title: 'Documents',
              hint: 'PDF, DOCX, JPG or PNG · max 5 MB each. Enter a start and end date for each document. Missing documents can be added later.',
              fields: vendorConsultantDocFields({ 'Resume': ['Marcus_Lee_Resume.pdf', '186 KB'] })
            }
          ],
          submit: { label: 'Save Consultant', target: 'consultants' },
          cancel: { label: 'Cancel', target: 'consultants' }
        }
      },
      {
        id: 'invoices',
        title: 'Invoices',
        description: 'Every invoice you have submitted, with its reconciliation result.',
        actions: [{ label: 'Upload Invoice', target: 'invoiceSubmit', primary: true }],
        tabs: ['All (12)', 'Approved (8)', 'In Progress (3)', 'Rejected (1)'],
        table: {
          title: 'October 2026',
          total: 12,
          headers: ['Invoice #', 'Consultant', 'Client', 'Hours', 'Amount', 'Submitted', 'Status', 'Actions'],
          rows: [
            [mono('INV-2026-10-0203'), person('Deepa Kumar'), 'Persistent', '160', '$12,800.00', 'Nov 3, 2026', b('Rejected'), '<div class="row-actions"><button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0203">View</button><button class="link-btn" data-target="rejectedInvoice">Correct</button></div>'],
            [mono('INV-2026-10-0142'), person('Rinaldo Silva'), 'Citus Tech', '168', '$12,096.00', 'Nov 4, 2026 (v2)', b('Approved'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0142">View</button>'],
            [mono('INV-2026-10-0198'), person('Omar Haddad'), 'Persistent', '144', '$12,096.00', 'Nov 3, 2026', b('In Progress'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0198">View</button>'],
            [mono('INV-2026-10-0176'), person('Sofia Marin'), 'Citus Tech', '168', '$12,768.00', 'Nov 2, 2026', b('In Progress'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0176">View</button>']
          ]
        }
      },
      {
        id: 'invoiceSubmit',
        parent: 'invoices',
        title: 'Upload Invoice',
        description: 'One invoice per consultant per month, with its timesheet. Months already submitted for that consultant are not offered.',
        form: {
          sections: [
            {
              title: 'Assignment',
              fields: [
                { label: 'Consultant', type: 'select', options: ['Omar Haddad — Persistent', 'Sofia Marin — Citus Tech'], required: true },
                { label: 'Billing period', type: 'select', options: ['November 2026'], required: true },
                { label: 'Total billed hours', value: '144', required: true },
                { label: 'Hourly rate', value: '$84.00', readonly: true },
                { label: 'Invoice amount (USD)', value: '$12,096.00', readonly: true },
                { label: 'Payment term', value: 'Net 10', readonly: true }
              ]
            },
            {
              title: 'Attachments',
              hint: 'PDF, DOCX, JPG, JPEG or PNG · max 5 MB per file.',
              fields: [
                { label: 'Invoice', type: 'upload', file: 'CS-INV-10482.pdf', size: '212 KB' },
                { label: 'Timesheet', type: 'upload', file: 'Haddad_Oct2026_timesheet.xlsx.pdf', size: '96 KB' }
              ]
            }
          ],
          submit: { label: 'Submit for Reconciliation', target: 'invoices' },
          cancel: { label: 'Cancel', target: 'invoices' }
        }
      },
      {
        id: 'rejectedInvoice',
        parent: 'invoices',
        title: 'Correct Rejected Invoice',
        description: 'INV-2026-10-0203 · Deepa Kumar · Persistent · October 2026',
        alert: {
          tone: 'danger',
          title: 'Rejected on Nov 10, 2026 at 9:58 AM',
          text: 'Total hours did not match the client invoice uploaded by Alicia Ross. Correct the hours and timesheet, then resubmit. Previous versions are kept in history.'
        },
        table: {
          title: 'Mismatch details',
          noSearch: true,
          headers: ['Field', 'Expected (client invoice)', 'Submitted (v1)', 'Result'],
          rows: [
            ['Billing period', 'October 2026', 'October 2026', b('Matched')],
            ['Total hours', '168', diff('160'), b('Mismatch')]
          ]
        },
        form: {
          sections: [
            {
              title: 'Corrected submission (v2)',
              fields: [
                { label: 'Total billed hours', value: '168', required: true },
                { label: 'Invoice amount (USD)', value: '$13,440.00', readonly: true },
                { label: 'Corrected timesheet', type: 'upload', file: 'Kumar_Oct2026_timesheet_v2.pdf', size: '102 KB' },
                { label: 'Corrected invoice', type: 'upload', file: 'CS-INV-10477-R1.pdf', size: '214 KB' },
                { label: 'Note to account manager', type: 'textarea', full: true, value: 'Timesheet v1 omitted Oct 29–30 (16 h). Corrected timesheet attached, approved by client manager.' }
              ]
            }
          ],
          submit: { label: 'Resubmit', target: 'invoices' },
          cancel: { label: 'Cancel', target: 'invoices' }
        }
      },
      {
        id: 'docs',
        title: 'Documents',
        description: 'Company documents. You upload W-9, COI and ACH; MSA and PO are uploaded by your account manager (view and download only). Replacing a document keeps the earlier version in history.',
        table: {
          title: 'Coral Staffing LLC',
          total: 5,
          headers: ['Document', 'Validity', 'Version', 'Last Updated', 'Status', 'Actions'],
          rows: [
            ['MSA', 'Jan 1, 2026 – Dec 31, 2027', 'v2', 'Jan 3, 2026', b('Valid'), '<div class="row-actions"><button type="button" class="link-btn" data-preview>View</button><button type="button" class="link-btn" data-download>Download</button><span class="lock">Uploaded by account manager</span></div>'],
            ['PO #PO-38817', 'Jan 1, 2026 – Dec 31, 2026', 'v1', 'Jan 3, 2026', b('Valid'), '<div class="row-actions"><button type="button" class="link-btn" data-preview>View</button><button type="button" class="link-btn" data-download>Download</button><span class="lock">Uploaded by account manager</span></div>'],
            ['W-9', 'Jan 1, 2026 – Dec 31, 2026', 'v3', 'Feb 11, 2026', b('Valid'), acts('View', 'Download', 'Replace')],
            ['COI', 'Nov 26, 2025 – Nov 25, 2026', 'v2', 'Nov 20, 2025', b('Expiring Soon'), acts('View', 'Download', 'Replace')],
            ['ACH form', '—', 'v1', 'Jan 3, 2026', b('Valid'), acts('View', 'Download', 'Replace')]
          ]
        }
      },
      {
        id: 'profile',
        title: 'Company Profile',
        description: 'You can update address, phone and authorized signatory. Other fields are managed by your account manager.',
        form: {
          sections: [
            {
              title: 'Company',
              fields: [
                { label: 'Vendor name', value: 'Coral Staffing LLC', readonly: true, lock: 'Admin-managed' },
                { label: 'Federal ID (EIN)', value: '74-3029118', readonly: true, lock: 'Admin-managed' },
                { label: 'Email', value: 'ap@coralstaffing.com', readonly: true, lock: 'Admin-managed' },
                { label: 'State of incorporation', value: 'Texas', readonly: true, lock: 'Admin-managed' },
                { label: 'Address', value: '401 Congress Ave, Suite 1540, Austin, TX 78701', full: true },
                { label: 'Phone', value: '(512) 555-0136' },
                { label: 'Account manager', value: 'Alicia Ross', readonly: true, lock: 'Admin-managed' },
                { label: 'Payment term', value: vendorPaymentTerm('Coral Staffing LLC'), readonly: true, lock: 'Set by account manager', note: 'Applies to all your consultants.' }
              ]
            },
            {
              title: 'Authorized signatory',
              fields: [
                { label: 'Name', value: 'Daniel Ortiz' },
                { label: 'Phone', value: '(512) 555-0161' }
              ]
            }
          ],
          submit: { label: 'Save Changes', target: 'dashboard' },
          cancel: { label: 'Cancel', target: 'dashboard' }
        }
      }
    ]
  },

  /* =============================================================== */
  w2: {
    name: 'W-2 Resource',
    user: { name: 'Maya Reed', role: 'W-2 Resource', email: 'maya.reed@outlook.com' },
    notifications: 1,
    nav: [
      { label: 'Dashboard', target: 'dashboard' },
      { label: 'Timesheets', target: 'status' },
      { label: 'My Documents', target: 'docs' }
    ],
    screens: [
      {
        id: 'dashboard',
        title: 'Welcome back, Maya',
        description: 'W-2 employees submit a monthly timesheet. No invoice is needed.',
        alert: {
          tone: 'warning',
          title: 'Your I-9 is incomplete',
          text: 'Upload your I-9 so your onboarding file is complete. Your account manager, Alicia Ross, has been notified.',
          action: { label: 'Upload', target: 'docs' }
        },
        kpis: [
          { label: 'October timesheet', value: 'Submitted', trend: 'Approved · 168 h', tone: 'up' },
          { label: 'Approved this year', value: '17', trend: 'No open rejections', tone: 'up' },
          { label: 'Documents to action', value: '1', trend: 'I-9 incomplete', tone: 'warn' }
        ],
        panels: [
          {
            title: 'Submission status by month',
            chip: 'Last 3 months',
            items: [
              { label: sub('October 2026', 'HTC · 168 h'), value: b('Approved'), meta: '' },
              { label: sub('September 2026', 'HTC · 160 h'), value: b('Approved'), meta: '' },
              { label: sub('August 2026', 'HTC · 168 h'), value: b('Approved'), meta: '' }
            ]
          }
        ]
      },
      {
        id: 'status',
        title: 'Timesheets',
        description: 'Each timesheet is matched against the client invoice hours.',
        actions: [{ label: 'Upload Timesheet', target: 'timesheet', primary: true }],
        table: {
          title: 'Submission history',
          total: 8,
          // No Client column: a resource works for one client only.
          headers: ['Period', 'Hours', 'Timesheet', 'Submitted', 'Status'],
          rows: [
            ['October 2026', '168', fileChip('Reed_Oct26.pdf'), 'Nov 2, 2026', b('Approved')],
            ['September 2026', '160', fileChip('Reed_Sep26_v2.pdf'), 'Oct 6, 2026 (v2)', b('Approved')],
            ['August 2026', '168', fileChip('Reed_Aug26.pdf'), 'Sep 2, 2026', b('Approved')]
          ]
        }
      },
      {
        id: 'timesheet',
        parent: 'status',
        title: 'Upload Timesheet',
        description: 'One timesheet per month. Months already submitted are not offered.',
        form: {
          sections: [
            {
              title: 'Timesheet',
              fields: [
                { label: 'Billing period', type: 'select', options: ['November 2026'], required: true },
                { label: 'Total hours', value: '160', required: true },
                { label: 'Timesheet', type: 'upload', file: 'Reed_Nov26.pdf', size: '88 KB' }
              ]
            }
          ],
          submit: { label: 'Upload Timesheet', target: 'status' },
          cancel: { label: 'Cancel', target: 'status' }
        }
      },
      {
        id: 'docs',
        title: 'My Documents',
        description: 'Onboarding and employment documents on file.',
        table: {
          title: 'Documents',
          total: 8,
          headers: ['Document', 'Last Updated', 'Expires', 'Status', 'Actions'],
          rows: [
            ['W-4', 'Mar 2, 2026', '—', b('Valid'), acts('View')],
            ['I-9', '—', '—', b('Incomplete'), '<button class="btn btn-primary btn-sm">Upload</button>'],
            ['Employment contract', 'Feb 24, 2026', 'Feb 26, 2027', b('Valid'), acts('View')],
            ['ACH form', 'Mar 2, 2026', '—', b('Valid'), acts('View', 'Replace')],
            ['Payslips', 'Nov 6, 2026', '—', b('Uploaded'), acts('View')],
            ['W-2 (year end)', '—', '—', b('Not Applicable'), '<span class="person-sub inline">Available Jan 2027</span>']
          ]
        }
      }
    ]
  },

  /* =============================================================== */
  w9: {
    name: '1099 Resource',
    user: { name: 'Jordan Blake', role: '1099 Resource', email: 'jordan@blakeux.studio' },
    notifications: 2,
    nav: [
      { label: 'Dashboard', target: 'dashboard' },
      { label: 'Invoices', target: 'status' },
      { label: 'My Documents', target: 'docs' }
    ],
    screens: [
      {
        id: 'dashboard',
        title: 'Welcome back, Jordan',
        description: '1099 contractors submit a monthly invoice and timesheet.',
        alert: {
          tone: 'danger',
          title: 'Your September invoice for HTC was rejected',
          text: 'INV-2026-09-0388 — billing period did not match the client invoice.',
          action: { label: 'Correct invoice', target: 'correction' }
        },
        kpis: [
          { label: 'Billed in October', value: '$13,680', trend: '152 h · HTC', tone: 'neutral' },
          { label: 'Rejected to fix', value: '1', trend: 'Action needed', tone: 'down' },
          { label: 'Documents', value: 'All valid', trend: '1099 form due Jan 2027', tone: 'up' }
        ],
        panels: [
          {
            title: 'Invoices by month',
            chip: 'Last 3 months',
            items: [
              { label: sub('October 2026', 'HTC · $13,680.00'), value: b('In Progress'), meta: '' },
              { label: sub('September 2026', 'HTC · $14,400.00'), value: b('Rejected'), meta: '' },
              { label: sub('August 2026', 'HTC · $15,120.00'), value: b('Approved'), meta: '' }
            ]
          }
        ]
      },
      {
        id: 'status',
        title: 'Invoices',
        description: 'Your submitted invoices and their reconciliation result.',
        actions: [{ label: 'Upload Invoice', target: 'invoiceSubmit', primary: true }],
        table: {
          title: 'Invoice history',
          total: 8,
          // No Client column: a resource works for one client only.
          headers: ['Invoice #', 'Period', 'Hours', 'Amount', 'Status', 'Actions'],
          rows: [
            [mono('INV-2026-10-0151'), 'Oct 2026', '152', '$13,680.00', b('Awaiting Client Invoice'), invoiceViewAction('INV-2026-10-0151')],
            [mono('INV-2026-09-0388'), 'Sep 2026', '160', '$14,400.00', b('Rejected'), `<div class="row-actions">${invoiceViewAction('INV-2026-09-0388')}<button class="link-btn" data-target="correction">Correct</button></div>`],
            [mono('INV-2026-08-0301'), 'Aug 2026', '168', '$15,120.00', b('Approved'), invoiceViewAction('INV-2026-08-0301')]
          ]
        }
      },
      {
        id: 'invoiceSubmit',
        parent: 'status',
        title: 'Upload Invoice',
        description: 'One invoice and timesheet per month. Months already submitted are not offered.',
        form: {
          sections: [
            {
              title: 'Invoice',
              fields: [
                { label: 'Billing period', type: 'select', options: ['November 2026'], required: true },
                { label: 'Total billed hours', value: '136', required: true },
                { label: 'Hourly rate', value: '$90.00', readonly: true },
                { label: 'Invoice amount (USD)', value: '$12,240.00', readonly: true },
                { label: 'Payment term', value: 'Net 10', readonly: true }
              ]
            },
            {
              title: 'Attachments',
              hint: 'PDF, DOCX, JPG, JPEG or PNG · max 5 MB per file.',
              fields: [
                { label: 'Invoice', type: 'upload', file: 'BlakeUX-0047.pdf', size: '154 KB' },
                { label: 'Timesheet', type: 'upload' }
              ]
            }
          ],
          submit: { label: 'Upload Invoice', target: 'status' },
          cancel: { label: 'Cancel', target: 'status' }
        }
      },
      {
        id: 'correction',
        parent: 'status',
        title: 'Correct Rejected Invoice',
        description: 'INV-2026-09-0388 · HTC · UX Consultant',
        alert: {
          tone: 'danger',
          title: 'Rejected on Oct 9, 2026',
          text: 'The billing period on your invoice did not match the client invoice. Correct the period and resubmit. Earlier versions are kept.'
        },
        table: {
          title: 'Mismatch details',
          noSearch: true,
          headers: ['Field', 'Expected (client invoice)', 'Submitted (v1)', 'Result'],
          rows: [
            ['Billing period', 'September 2026', diff('August 2026'), b('Mismatch')],
            ['Total hours', '160', '160', b('Matched')]
          ]
        },
        form: {
          sections: [
            {
              title: 'Corrected submission (v2)',
              fields: [
                { label: 'Billing period', type: 'select', options: ['September 2026', 'August 2026'] },
                { label: 'Total billed hours', value: '160' },
                { label: 'Corrected invoice', type: 'upload', file: 'BlakeUX-0041-R1.pdf', size: '150 KB' },
                { label: 'Timesheet', type: 'upload', file: 'Blake_HTC_Sep26.pdf', size: '92 KB' }
              ]
            }
          ],
          submit: { label: 'Resubmit', target: 'status' },
          cancel: { label: 'Cancel', target: 'status' }
        }
      },
      {
        id: 'docs',
        title: 'My Documents',
        description: 'Tax and contract documents. Tax documents are retained for 7 years.',
        table: {
          title: 'Documents',
          total: 4,
          headers: ['Document', 'Last Updated', 'Expires', 'Status', 'Actions'],
          rows: [
            ['1099 contract — HTC', 'Jul 1, 2026', 'Jan 8, 2027', b('Signed'), acts('View')],
            ['W-9', 'Jun 30, 2026', '—', b('Valid'), acts('View', 'Replace')],
            ['ACH form', 'Jun 30, 2026', '—', b('Valid'), acts('View', 'Replace')],
            ['1099-NEC (2026)', '—', '—', b('Not Applicable'), '<span class="person-sub inline">Issued by Jan 31, 2027</span>']
          ]
        }
      }
    ]
  }
};

/* Account managers onboard vendors and resources with the same forms,
   pre-assigned to themselves. */
(function shareOnboardingForms() {
  const am = personaConfig.accountmanager;
  const parents = { vendorAdd: 'vendorList', resourceAdd: 'teamMembers' };
  Object.entries(parents).forEach(([id, parent]) => {
    const source = personaConfig.superadmin.screens.find((s) => s.id === id);
    const copy = JSON.parse(JSON.stringify(source));
    copy.parent = parent;
    copy.form.submit.target = parent;
    copy.form.cancel.target = parent;
    copy.form.sections.forEach((section) => {
      section.fields = section.fields.map((f) => (f.label === 'Account manager' ? { label: 'Account manager', value: 'Alicia Ross (you)', readonly: true, lock: 'Assigned to you' } : f));
    });
    am.screens.push(copy);
  });

  // Client edit for the AM's own clients (PRD: R, U own clients; no delete).
  ['clientEdit'].forEach((id) => {
    const source = personaConfig.superadmin.screens.find((s) => s.id === id);
    if (!source) return;
    const copy = JSON.parse(JSON.stringify(source));
    copy.parent = 'clients';
    if (copy.form) {
      delete copy.form.delete;
      copy.form.sections.forEach((section) => {
        section.fields = section.fields.map((f) => (f.label === 'Account manager' ? { label: 'Account manager', value: 'Alicia Ross (you)', readonly: true, lock: 'Assigned by Super Admin' } : f));
      });
    }
    am.screens.push(copy);
  });

  // Team member View / Edit: Super Admin and Account Manager (own clients) can view and edit.
  ['superadmin', 'accountmanager'].forEach((key) => {
    MEMBER_SCREENS.forEach((s) => personaConfig[key].screens.push(JSON.parse(JSON.stringify(s))));
  });

  // Super Admin can add consultants for a vendor too: same form the Account Manager uses.
  const sa = personaConfig.superadmin;
  const saConsultants = sa.screens.find((s) => s.id === 'vendorConsultants');
  saConsultants.actions = [{ label: 'Add Consultant', target: 'consultantAdd', primary: true }];
  sa.screens.push(JSON.parse(JSON.stringify(am.screens.find((s) => s.id === 'consultantAdd'))));

  // Super Admin and Account Manager: each person's invoices and timesheets — upload anything missing,
  // or submit a new invoice / timesheet on the person's behalf.
  ['superadmin', 'accountmanager'].forEach((key) => {
    personaConfig[key].screens.push(
      { id: 'memberSubmissions', parent: 'teamMembers', title: 'Invoices & Timesheets' },
      { id: 'submitOnBehalf', parent: 'teamMembers', title: 'Submit on behalf' }
    );
  });

  // Super Admin: Admin User Management — add, edit, delete account managers.
  sa.screens.push(
    {
      id: 'adminUsers',
      title: 'User Account Management',
      description: 'Add, edit or delete account managers. New account managers receive an email invite to set their password.',
      actions: [{ label: 'Add Account Manager', target: 'adminUserAdd', primary: true }]
    },
    {
      id: 'adminUserAdd',
      parent: 'adminUsers',
      title: 'Add Account Manager',
      description: 'Enter the account manager’s details and choose the clients they manage. Vendors can be assigned to them afterwards from Vendors.'
    },
    { id: 'adminUserEdit', parent: 'adminUsers', title: 'Edit Account Manager' }
  );

  // Invoices: View opens the invoice (all three); Super Admin / AM can upload missing or corrected documents.
  ['superadmin', 'accountmanager'].forEach((key) => {
    personaConfig[key].screens.push(
      { id: 'invoiceDetail', parent: 'vendorInvoices', title: 'Invoice' },
      { id: 'invoiceUpdate', parent: 'vendorInvoices', title: 'Update Invoice' },
      // Invoice Management: Review opens the client invoice and the person's document side by side.
      { id: 'invoiceReview', parent: 'invoiceUpload', title: 'Review' },
      // Read-only View pop-ups (separate from Edit).
      { id: 'clientView', parent: 'clients', title: 'Client' },
      { id: 'clientInvoices', parent: 'clients', title: 'Client invoices' },
      { id: 'vendorView', parent: key === 'superadmin' ? 'vendors' : 'vendorList', title: 'Vendor' }
    );
  });
  personaConfig.vendor.screens.push({ id: 'invoiceDetail', parent: 'invoices', title: 'Invoice' });

  // Vendor: View / Edit on their own consultants opens the consultant's profile / edit form.
  MEMBER_SCREENS.forEach((s) => personaConfig.vendor.screens.push({ ...JSON.parse(JSON.stringify(s)), parent: 'consultants' }));

  // Document Tracker: View opens the document with its full version history.
  personaConfig.superadmin.screens.push({ id: 'docDetail', parent: 'documentTracker', title: 'Document' });
  personaConfig.accountmanager.screens.push({ id: 'docDetail', parent: 'docs', title: 'Document' });

  // 1099 resource: View on an invoice shows the invoice and timesheet.
  personaConfig.w9.screens.push({ id: 'invoiceView', parent: 'status', title: 'Invoice' });
})();

/* Buttons shared across personas can name a screen another persona owns.
   Send those to the nearest equivalent; ignore anything else unmatched. */
const TARGET_ALIASES = {
  superadmin: { reconciliation: 'invoiceUpload', invoiceAudit: 'invoiceUpload', rejectedInvoice: 'invoiceUpload' },
  accountmanager: { reconciliation: 'invoiceUpload', invoiceAudit: 'invoiceUpload', rejectedInvoice: 'invoiceUpload' }
};

function resolveTarget(target) {
  const screens = personaConfig[activePersona].screens;
  const alias = (TARGET_ALIASES[activePersona] || {})[target];
  const resolved = alias || target;
  return screens.some((s) => s.id === resolved) ? resolved : null;
}

/* ---------- DOM refs & state ---------- */

const loginScreen = document.getElementById('loginScreen');
const appShell = document.getElementById('appShell');
const personaNav = document.getElementById('personaNav');
const leftNav = document.getElementById('leftNav');
const screenContainer = document.getElementById('screenContainer');
const pageTitle = document.getElementById('pageTitle');
const breadcrumb = document.getElementById('breadcrumb');
const loginButton = document.getElementById('loginButton');
const userName = document.getElementById('userName');
const userRole = document.getElementById('userRole');
const userPill = document.getElementById('userPill');
const notifCount = document.getElementById('notifCount');

let activePersona = 'superadmin';
let activeScreen = 'dashboard';
let activeTab = 0;
let selectedClientInvoiceClient = 'All clients'; // Invoice Management client filter

/* ---------- Sign-in: staff password, or one-time code for vendors / resources ---------- */

function enterApp(personaKey) {
  activePersona = personaKey;
  activeScreen = 'dashboard';
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  render();
  // First app entry sits on top of the sign-in page, so Back from the dashboard returns to sign-in.
  navDepth = 0;
  history.pushState({ nav: navSnapshot(), depth: 0 }, '');
}

loginButton.addEventListener('click', () => enterApp('superadmin'));

document.getElementById('signOut').addEventListener('click', () => {
  appShell.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  showPane('paneStaff');
});

const otpAccounts = {
  'd.ortiz@coralstaffing.com': 'vendor',
  'maya.reed@outlook.com': 'w2',
  'jordan@blakeux.studio': 'w9'
};
const inactiveAccounts = ['billing@orbitsystems.com'];

const otpEmail = document.getElementById('otpEmail');
const otpEmailError = document.getElementById('otpEmailError');
const otpCodeError = document.getElementById('otpCodeError');
const otpInputs = [...document.querySelectorAll('#otpBoxes input')];
const verifyCode = document.getElementById('verifyCode');
const resendCode = document.getElementById('resendCode');
let resendInterval = null;
let attemptsLeft = 5;

function showPane(id) {
  document.querySelectorAll('.login-pane').forEach((pane) => pane.classList.toggle('hidden', pane.id !== id));
  if (id === 'paneOtpEmail') otpEmail.focus();
  if (id === 'paneOtpCode') otpInputs[0].focus();
}

function showError(el, message) {
  el.textContent = message;
  el.classList.toggle('hidden', !message);
}

document.getElementById('openOtp').addEventListener('click', () => showPane('paneOtpEmail'));
document.querySelectorAll('.back-link').forEach((btn) => btn.addEventListener('click', () => showPane(btn.dataset.pane)));

document.querySelectorAll('.demo-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    otpEmail.value = chip.dataset.email;
    showError(otpEmailError, '');
  });
});

function startResendTimer() {
  let seconds = 30;
  clearInterval(resendInterval);
  resendCode.disabled = true;
  resendCode.innerHTML = `Resend code in <span id="resendTimer">${seconds}</span>s`;
  resendInterval = setInterval(() => {
    seconds -= 1;
    if (seconds <= 0) {
      clearInterval(resendInterval);
      resendCode.disabled = false;
      resendCode.textContent = 'Resend code';
    } else {
      document.getElementById('resendTimer').textContent = seconds;
    }
  }, 1000);
}

function resetCodeInputs() {
  otpInputs.forEach((input) => { input.value = ''; input.classList.remove('filled', 'invalid'); });
  verifyCode.disabled = true;
  showError(otpCodeError, '');
}

function sendCode() {
  const email = otpEmail.value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError(otpEmailError, 'Enter a valid email address.');
    return;
  }
  if (inactiveAccounts.includes(email)) {
    showError(otpEmailError, 'This account is inactive. Contact your account manager to restore access.');
    return;
  }
  if (!otpAccounts[email]) {
    showError(otpEmailError, 'We couldn’t find a vendor or resource account for this email. Check the address or contact your account manager.');
    return;
  }
  showError(otpEmailError, '');
  document.getElementById('otpSentTo').textContent = email;
  attemptsLeft = 5;
  resetCodeInputs();
  showPane('paneOtpCode');
  startResendTimer();
}

document.getElementById('sendCode').addEventListener('click', sendCode);
otpEmail.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendCode(); });

function currentCode() {
  return otpInputs.map((input) => input.value).join('');
}

function updateCodeState() {
  otpInputs.forEach((input) => { input.classList.toggle('filled', !!input.value); input.classList.remove('invalid'); });
  if (attemptsLeft <= 0) return;
  verifyCode.disabled = currentCode().length !== 6;
  showError(otpCodeError, '');
}

otpInputs.forEach((input, i) => {
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(-1);
    if (input.value && i < otpInputs.length - 1) otpInputs[i + 1].focus();
    updateCodeState();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !input.value && i > 0) otpInputs[i - 1].focus();
    if (e.key === 'Enter' && !verifyCode.disabled) verifyCode.click();
  });
  input.addEventListener('paste', (e) => {
    const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    e.preventDefault();
    otpInputs.forEach((box, j) => { box.value = digits[j] || ''; });
    otpInputs[Math.min(digits.length, 5)].focus();
    updateCodeState();
  });
});

verifyCode.addEventListener('click', () => {
  if (currentCode() === '000000') {
    attemptsLeft -= 1;
    otpInputs.forEach((input) => input.classList.add('invalid'));
    showError(otpCodeError, attemptsLeft > 0
      ? `That code is incorrect. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left.`
      : 'Too many incorrect attempts. Request a new code to continue.');
    verifyCode.disabled = true;
    return;
  }
  clearInterval(resendInterval);
  enterApp(otpAccounts[document.getElementById('otpSentTo').textContent]);
});

resendCode.addEventListener('click', () => {
  attemptsLeft = 5;
  resetCodeInputs();
  startResendTimer();
  const note = document.createElement('div');
  note.className = 'login-success';
  note.textContent = 'A new code is on its way.';
  resendCode.parentElement.after(note);
  setTimeout(() => note.remove(), 3000);
  otpInputs[0].focus();
});

/* ---------- Mobile menu (☰ Menu on phones) ---------- */
const sidebarEl = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');

function closeMobileMenu() {
  sidebarEl.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.textContent = '☰ Menu';
}

menuToggle.addEventListener('click', () => {
  const open = !sidebarEl.classList.contains('menu-open');
  sidebarEl.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.textContent = open ? '✕ Close' : '☰ Menu';
});

/* ---------- Back navigation (Android back button / gesture, browser Back) ----------
   Every screen change is a history entry holding what is on screen, so the system Back
   button steps back through the app instead of leaving it. */
let navDepth = 0;
let restoringNav = false;
let replaceNextNav = false;

/* Add / edit forms open as pop-ups over the screen they were opened from (modalBase). */
const MODAL_SCREENS = new Set([
  'clientAdd', 'clientEdit', 'vendorAdd', 'vendorEdit', 'resourceAdd', 'consultantAdd', 'memberEdit',
  'submitOnBehalf', 'invoiceUpdate', 'adminUserAdd', 'adminUserEdit', 'invoiceSubmit', 'timesheet', 'correction', 'rejectedInvoice',
  'memberDetail', 'docDetail', 'invoiceDetail', 'invoiceView', 'invoiceReview', 'clientView', 'vendorView', 'clientInvoices'
]);
// Read-only pop-ups (View …). A form opened from one of these stacks on top of it.
const VIEW_MODALS = new Set(['memberDetail', 'docDetail', 'invoiceDetail', 'invoiceView', 'clientView', 'vendorView']);
let modalBase = null; // { screen, tab } behind the open pop-up
let modalPrev = null; // the View pop-up underneath a stacked form pop-up

function isModalId(id) {
  return MODAL_SCREENS.has(id) && !currentPersona().nav.some((n) => n.target === id) && !!findScreenExact(id);
}

function findScreenExact(id) {
  return currentPersona().screens.find((s) => s.id === id);
}

// Close the open pop-up: step back in history when the pop-up has its own entry, else go to the screen behind it.
function closeModal() {
  if (navDepth > 0 && history.state && history.state.nav && history.state.nav.screen === activeScreen) {
    history.back();
  } else {
    const base = (modalBase && modalBase.screen) || findScreen(activeScreen).parent || 'dashboard';
    goToScreen(base);
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || document.querySelector('.ms-panel:not([hidden])')) return;
  if (document.getElementById('docPreview')) { closePreview(false); return; }
  if (document.querySelector('[data-modal-backdrop]')) closeModal();
});

function navSnapshot() {
  return {
    persona: activePersona, screen: activeScreen, tab: activeTab, member: selectedMember, inv: selectedInv,
    invReturn: invoiceReturn, invoice: selectedInvoice, doc: selectedDoc, am: selectedAm, client: selectedClientInvoiceClient,
    rec: selectedRec, imStatus: imStatusFilter, ciClient, modalBase, modalPrev
  };
}

// Same screen, changed view (tab or filter): update the current history entry so Back / closing a pop-up keeps it.
function refreshNavState() {
  if (restoringNav || !history.state || !history.state.nav) return;
  history.replaceState({ nav: navSnapshot(), depth: history.state.depth }, '');
}

function pushNav() {
  if (restoringNav) return;
  const snap = navSnapshot();
  if (replaceNextNav) {
    // Leaving a pop-up for another screen: the pop-up's history entry becomes that screen.
    replaceNextNav = false;
    history.replaceState({ nav: snap, depth: (history.state && history.state.depth) || navDepth }, '');
    return;
  }
  const prev = history.state && history.state.nav;
  if (prev && JSON.stringify(prev) === JSON.stringify(snap)) {
    history.replaceState({ nav: snap, depth: history.state.depth }, ''); // same screen again: no new entry
    return;
  }
  navDepth += 1;
  history.pushState({ nav: snap, depth: navDepth }, '');
}

window.addEventListener('popstate', (event) => {
  closePreview(true); // Back closes an open document preview first
  const state = event.state;
  if (!state || !state.nav) {
    // Back from the first app screen returns to sign-in.
    appShell.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    showPane('paneStaff');
    navDepth = 0;
    return;
  }
  const s = state.nav;
  restoringNav = true;
  activePersona = s.persona; activeScreen = s.screen; activeTab = s.tab || 0;
  selectedMember = s.member; selectedInv = s.inv; invoiceReturn = s.invReturn; selectedInvoice = s.invoice;
  selectedDoc = s.doc; selectedAm = s.am; selectedClientInvoiceClient = s.client;
  selectedRec = s.rec || selectedRec; imStatusFilter = s.imStatus || 'All statuses'; imRejecting = false;
  ciClient = s.ciClient || ciClient;
  modalBase = s.modalBase || null;
  modalPrev = s.modalPrev || null;
  navDepth = state.depth || 0;
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  render();
  window.scrollTo({ top: 0 });
  restoringNav = false;
});

// On-screen Back (shown on nested screens): same as the system Back when there is in-app history.
function goBack(screen) {
  if (navDepth > 0) history.back();
  else if (screen.parent) goToScreen(screen.parent);
}

function setPersona(personaKey) {
  activePersona = personaKey;
  activeScreen = 'dashboard';
  activeTab = 0;
  render();
  pushNav();
}

function goToScreen(screenId, clientName, tab = 0) {
  if (screenId === 'invoiceUpload' && clientName) {
    selectedClientInvoiceClient = clientName;
  }
  if (screenId === 'clientInvoices' && clientName) ciClient = clientName;
  const fromModal = isModalId(activeScreen);
  const toModal = isModalId(screenId);
  const onOwnEntry = navDepth > 0 && history.state && history.state.nav && history.state.nav.screen === activeScreen;
  if (toModal && !fromModal) { modalBase = { screen: activeScreen, tab: activeTab }; modalPrev = null; }
  if (fromModal && toModal) {
    if (VIEW_MODALS.has(activeScreen)) {
      modalPrev = activeScreen; // opening a form (e.g. Edit) on top of a View pop-up
    } else if (modalPrev && screenId === modalPrev && onOwnEntry) {
      history.back(); // Save / Cancel back to the View underneath: close the form pop-up
      return;
    } else {
      replaceNextNav = true; // form saved to another pop-up: replace its entry so Back won't reopen it
      modalPrev = null;
    }
  }
  if (fromModal && !toModal) {
    // Save / Cancel back to the screen behind the pop-up(s): just close them (so Back won't reopen the form).
    if (modalBase && screenId === modalBase.screen && onOwnEntry) {
      history.go(modalPrev ? -2 : -1);
      return;
    }
    replaceNextNav = true;
    modalBase = null;
    modalPrev = null;
  }
  activeTab = tab;
  activeScreen = screenId;
  render();
  window.scrollTo({ top: 0 });
  pushNav();
}

function currentPersona() {
  return personaConfig[activePersona];
}

function findScreen(id) {
  const screens = currentPersona().screens;
  return screens.find((s) => s.id === id) || screens[0];
}

/* ---------- Chrome ---------- */

function renderLeftNav(screen) {
  // Highlight the nearest ancestor that is a menu item (e.g. Add Consultant → Vendor Consultants → Vendors).
  const navTargets = currentPersona().nav.map((item) => item.target);
  let navKey = screen.id;
  for (let s = screen, hops = 0; s && hops < 5; hops++) {
    if (navTargets.includes(s.id)) { navKey = s.id; break; }
    s = s.parent ? currentPersona().screens.find((x) => x.id === s.parent) : null;
  }
  leftNav.innerHTML = '';
  const makeButton = (item) => {
    const button = document.createElement('button');
    button.textContent = item.label;
    button.className = item.target === screen.id || item.target === navKey ? 'active' : '';
    button.addEventListener('click', () => { closeMobileMenu(); goToScreen(item.target); });
    return button;
  };
  const groups = {};
  currentPersona().nav.forEach((item) => {
    if (!item.group) { leftNav.appendChild(makeButton(item)); return; }
    // Grouped items (e.g. Settings → User Account Management, Audit Log) sit under a dropdown toggle.
    let g = groups[item.group];
    if (!g) {
      const toggle = document.createElement('button');
      toggle.className = 'nav-group-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = `<span>${item.group}</span><span class="nav-caret" aria-hidden="true">▾</span>`;
      const list = document.createElement('div');
      list.className = 'nav-group';
      list.hidden = true;
      toggle.addEventListener('click', () => {
        list.hidden = !list.hidden;
        openNavGroups[item.group] = !list.hidden;
        toggle.setAttribute('aria-expanded', String(!list.hidden));
      });
      leftNav.append(toggle, list);
      g = groups[item.group] = { toggle, list };
    }
    const button = makeButton(item);
    g.list.appendChild(button);
    // Keep the group open while one of its screens is shown, or after the user opened it.
    if (button.classList.contains('active') || openNavGroups[item.group]) {
      g.list.hidden = false;
      g.toggle.setAttribute('aria-expanded', 'true');
      if (button.classList.contains('active')) g.toggle.classList.add('has-active');
    }
  });
}
const openNavGroups = {};

// "View as" switcher: one dropdown listing every user type (the sample user's name is shown in the header).
function renderPersonaButtons() {
  personaNav.innerHTML = '';
  const select = document.createElement('select');
  select.className = 'persona-select';
  select.id = 'personaSelect';
  select.setAttribute('aria-label', 'View the prototype as');
  Object.entries(personaConfig).forEach(([key, persona]) => {
    const option = new Option(persona.name, key, false, key === activePersona);
    option.title = persona.user.name;
    select.appendChild(option);
  });
  select.addEventListener('change', () => { closeMobileMenu(); setPersona(select.value); });
  personaNav.appendChild(select);
}

function renderUser() {
  const { user, notifications } = currentPersona();
  userName.textContent = user.name;
  userRole.textContent = user.role;
  userPill.textContent = user.name.split(' ').map((p) => p[0]).join('');
  notifCount.textContent = notifications;
  notifCount.style.display = notifications ? '' : 'none';
}

function renderBreadcrumb(screen) {
  const back = screen.parent ? '<button type="button" class="back-btn" aria-label="Go back">‹ Back</button>' : '';
  const crumbs = [`${back}Home`];
  if (screen.parent) {
    const parent = findScreen(screen.parent);
    crumbs.push(`<button class="crumb-link" data-target="${parent.id}">${parent.title}</button>`);
  }
  if (screen.id !== 'dashboard') crumbs.push(screen.title);
  breadcrumb.innerHTML = crumbs.join('<span class="crumb-sep">/</span>');
}

/* ---------- Content blocks ---------- */

function actionButtons(actions) {
  if (!actions) return '';
  return actions.map((a) => `<button class="btn ${a.primary ? 'btn-primary' : 'btn-secondary'}" data-target="${a.target}">${a.label}</button>`).join('');
}

function createAlert(alert) {
  if (!alert) return '';
  return `
    <div class="alert alert-${alert.tone}">
      <div>
        <div class="alert-title">${alert.title}</div>
        <div class="alert-text">${alert.text}</div>
      </div>
      ${alert.action ? `<button class="btn btn-alert" data-target="${alert.action.target}">${alert.action.label}</button>` : ''}
    </div>
  `;
}

function createKpiRow(kpis) {
  if (!kpis) return '';
  const targets = DASHBOARD_KPI_TARGETS[activePersona] || ['dashboard', 'dashboard', 'dashboard', 'dashboard'];

  return `
    <div class="kpi-row" style="--kpi-cols: ${Math.min(kpis.length, 4)}">
      ${kpis.map((kpi, index) => `
        <button type="button" class="kpi-card" data-target="${targets[index] || 'dashboard'}">
          <div class="kpi-label">${kpi.label}</div>
          <div class="kpi-value">${kpi.value}</div>
          <div class="kpi-trend trend-${kpi.tone || 'neutral'}">${kpi.trend}</div>
        </button>
      `).join('')}
    </div>
  `;
}

function createPanel(panel) {
  // Bars with a target are buttons: they open that screen with the matching status tab selected.
  const body = panel.bars
    ? `<div class="bar-list">${panel.bars.map((bar) => {
        const inner = `
          <div class="bar-meta"><span>${bar.label}</span><span class="mini-stat">${bar.value}<span class="bar-go" aria-hidden="true">›</span></span></div>
          <div class="bar-track"><div class="bar-fill fill-${bar.tone}" style="width:${bar.pct}%"></div></div>`;
        return bar.target
          ? `<button type="button" class="bar-row bar-link" data-target="${bar.target}" data-tab="${bar.tab || 0}"${bar.status ? ` data-status="${bar.status}"` : ''} title="View ${bar.label.toLowerCase()} invoices">${inner}</button>`
          : `<div class="bar-row">${inner}</div>`;
      }).join('')}</div>`
    : `<ul class="list-plain">${panel.items.map((item) => `
        <li>
          <span class="li-label">${item.label}</span>
          <span class="li-right">${item.meta ? `<span class="li-meta">${item.meta}</span>` : ''}${item.value}</span>
        </li>`).join('')}</ul>`;

  return `
    <div class="widget">
      <div class="widget-header">
        <div class="widget-title">${panel.title}</div>
        ${panel.chip ? `<div class="action-chip">${panel.chip}</div>` : ''}
      </div>
      ${body}
    </div>
  `;
}

function createPanels(panels) {
  if (!panels) return '';
  return `<div class="content-grid${panels.length === 1 ? ' single' : ''}">${panels.map(createPanel).join('')}</div>`;
}

function createActivity(activity) {
  if (!activity) return '';
  return `
    <div class="widget activity">
      <div class="widget-header">
        <div class="widget-title">Recent activity</div>
        <button class="link-btn">View all</button>
      </div>
      <ul class="activity-list">
        ${activity.map((a) => `
          <li>
            <span class="avatar ${a.who === 'System' ? 'avatar-system' : ''}">${a.who === 'System' ? '⚙' : a.who.split(' ').map((p) => p[0]).join('')}</span>
            <span class="activity-text"><b>${a.who}</b> ${a.what}</span>
            <span class="li-meta">${a.when}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

function createTabs(tabs) {
  if (!tabs) return '';
  return `<div class="tabs">${tabs.map((t, i) => `<button type="button" class="tab ${i === activeTab ? 'active' : ''}" data-tab-index="${i}">${t}</button>`).join('')}</div>`;
}

// Filter a tabbed table to the active tab's status ("Approved (512)" → rows with an Approved badge).
function applyActiveTab(screen) {
  if (!screen.tabs || !screen.table || screen.typeTabs) return screen;
  if (activeTab >= screen.tabs.length) activeTab = 0;
  if (activeTab === 0) return screen;
  const label = screen.tabs[activeTab];
  const status = label.replace(/\s*\([\d,]+\)\s*$/, '').trim();
  const count = Number((label.match(/\(([\d,]+)\)/) || [])[1]?.replace(/,/g, '')) || 0;
  const matches = (cell) => typeof cell === 'string' && cell.toLowerCase().includes(`>${status.toLowerCase()}</span>`);
  const rows = screen.table.rows.filter((row) => row.some(matches));
  return {
    ...screen,
    table: {
      ...screen.table,
      rows: rows.length ? rows : [[`<span class="person-sub inline">No ${status.toLowerCase()} records in this view.</span>`, ...Array(screen.table.headers.length - 1).fill('')]],
      total: count || rows.length
    }
  };
}

function createFilters(filters) {
  if (!filters) return '';
  return `
    <div class="filter-bar">
      ${filters.map((f) => `
        <div class="field inline-field">
          <label>${f.label}</label>
          <select data-filter="${f.label}">${f.options.map((o) => `<option ${o === f.selected ? 'selected' : ''}>${o}</option>`).join('')}</select>
        </div>
      `).join('')}
    </div>
  `;
}

function createTable(table) {
  if (!table) return '';
  const shown = table.rows.length;
  return `
    <div class="table-card">
      <div class="table-header-row">
        <div class="table-heading">
          <div class="card-title">${table.title}</div>
          ${table.chip ? `<span class="action-chip">${table.chip}</span>` : ''}
        </div>
        ${table.noSearch ? '' : `
          <div class="table-tools">
            <input class="table-search" placeholder="Search…" />
            <button class="btn btn-secondary">Filter</button>
          </div>`}
      </div>
      <div class="table-scroll">
        <table>
          <thead><tr>${table.headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>
            ${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${table.total ? `
        <div class="table-footer">
          <span>Showing 1–${shown} of ${table.total.toLocaleString('en-US')}</span>
          ${table.total > shown ? '<span class="pager"><button class="pager-btn" disabled>‹</button><button class="pager-btn active">1</button><button class="pager-btn">2</button><button class="pager-btn">3</button><button class="pager-btn">›</button></span>' : ''}
        </div>` : ''}
    </div>
  `;
}

const UPLOAD_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>';

// The three parts of a document row: the file control, its dates, and the Uploaded / Not uploaded badge.
function uploadParts(field) {
  const locked = field.amOnly || field.byOther;
  let file;
  // Uploaded only by the account manager (e.g. a consultant's I-9 audit report): the vendor can view and download, never edit or delete.
  // `byOther`: the document is uploaded by someone else (e.g. the vendor uploads W-9 / COI / ACH), so this form shows a note.
  if (locked) {
    file = field.file
      ? `<div class="upload-done">${fileChip(field.file, field.size)}<span class="lock">View / download only</span></div>`
      : `<div class="upload-locked">${field.byOther || 'Uploaded later by your account manager, then renewed every 3 or 6 months (only the latest is shown). You can view and download it, but not edit or delete it.'}</div>`;
  } else {
    file = field.file
      ? `<div class="upload-done">${fileChip(field.file, field.size)}<button class="link-btn">Replace</button></div>`
      : `<div class="upload-box compact" ${field.multiple ? 'data-multiple' : ''} role="button" tabindex="0">
          <span class="upload-btn">${UPLOAD_ICON}${field.multiple ? 'Choose files' : 'Choose file'}</span>
          <span class="upload-hint">PDF, DOCX, JPG, PNG · max 5 MB${field.multiple ? ' each · several allowed' : ''}</span>
          <input type="file" class="upload-input" accept=".pdf,.docx,.jpg,.jpeg,.png" ${field.multiple ? 'multiple' : ''} hidden />
        </div>
        <div class="upload-list"></div>`;
  }
  let dates = '';
  if (field.expiry) {
    dates += '<div class="validity-row single"><div class="validity-cell"><span class="expiry-label">Expiry date</span><input type="date" /></div></div>';
  }
  // Periodic audit report: the account manager picks the period it covers (3 or 6 months) and its start.
  if (field.auditPeriod) {
    dates += `<div class="validity-row">
        <div class="validity-cell"><span class="expiry-label">Audit period</span><select><option>6 months</option><option>3 months</option></select></div>
        <div class="validity-cell"><span class="expiry-label">Period start</span><input type="date" /></div>
      </div>
      <span class="person-sub">A new report replaces the one shown; earlier reports stay in version history.</span>`;
  }
  if (field.validity) {
    dates += `<div class="validity-row">
        <div class="validity-cell"><span class="expiry-label">Start date</span><input type="date" value="${field.start || ''}" /></div>
        <div class="validity-cell"><span class="expiry-label">End date</span><input type="date" value="${field.end || ''}" /></div>
      </div>`;
  }
  const state = locked ? '' : field.file ? '<span class="doc-state ok">Uploaded</span>' : '<span class="doc-state">Not uploaded</span>';
  return { file, dates, state };
}

function createField(field) {
  const req = field.required ? '<span class="req">*</span>' : '';
  const label = field.label ? `<label>${field.label}${req}${field.readonly ? `<span class="lock">${field.lock || 'Auto-filled'}</span>` : ''}</label>` : '';
  let control = '';

  switch (field.type) {
    case 'select': {
      // Payment terms saved via "Custom" are offered in every payment-term dropdown, just before "Custom".
      const options = field.customInput
        ? [...field.options.filter((o) => o !== 'Custom'), ...customTerms.filter((t) => !field.options.includes(t)), 'Custom']
        : field.options;
      control = `<select ${field.customInput ? 'data-custom-select' : ''} ${field.addOption ? `data-add-option="${field.addOption.trigger}"` : ''}>${options.map((o) => `<option>${o}</option>`).join('')}</select>`;
      // Picking the trigger option (e.g. "Location") reveals a field to type a new value and add it.
      if (field.addOption) {
        control += `<div class="custom-term-row add-option-row" hidden>
            <input class="add-option-input" placeholder="${field.addOption.placeholder}" />
            <button type="button" class="btn btn-secondary btn-sm add-option-btn">Add</button>
          </div>`;
      }
      if (field.customInput) {
        control += `<div class="custom-term-row" hidden>
            <input class="custom-term" placeholder="Enter term, e.g. Net 20 or Net 25" />
            <button type="button" class="btn btn-secondary btn-sm custom-term-add">Add</button>
          </div>
          <span class="field-note" hidden>Use the format Net + number of days, e.g. Net 20.</span>`;
      }
      break;
    }
    case 'date':
      control = `<input type="date" value="${field.value || ''}" />`;
      break;
    case 'textarea':
      control = `<textarea>${field.value || ''}</textarea>`;
      break;
    case 'upload': {
      // Every document is one row: name + status | file | dates. Without a label (e.g. inside a review panel) it stacks.
      const { file, dates, state } = uploadParts(field);
      const showForAttr = field.showFor ? ` data-show-for="${field.showFor}"${field.startHidden ? ' hidden' : ''}` : '';
      if (!field.label) {
        return `<div class="field doc-field doc-bare"${showForAttr}>${file}${dates}${field.note ? `<span class="person-sub">${field.note}</span>` : ''}</div>`;
      }
      return `<div class="field doc-field ${dates ? 'has-dates' : ''}"${showForAttr}>
          <div class="doc-name">${label}${state}${field.note ? `<span class="person-sub">${field.note}</span>` : ''}</div>
          <div class="doc-file">${file}</div>
          ${dates ? `<div class="doc-dates">${dates}</div>` : ''}
        </div>`;
    }
    case 'multiselect': {
      // Dropdown with search + checkboxes; selected values show as chips in the closed control.
      const selected = field.selected || [];
      control = `<div class="ms" data-ms>
          <button type="button" class="ms-toggle" aria-haspopup="listbox" aria-expanded="false">
            <span class="ms-summary" data-placeholder="${field.placeholder || 'Select…'}"></span><span class="ms-caret" aria-hidden="true">▾</span>
          </button>
          <div class="ms-panel" hidden>
            <input type="text" class="ms-search" placeholder="Search…" />
            <div class="ms-list" role="listbox" aria-multiselectable="true">
              ${field.options.map((o) => `<div class="ms-option" role="option"><input type="checkbox" value="${o.value}" ${selected.includes(o.value) ? 'checked data-initial' : ''} /><span class="ms-name">${o.value}</span><span class="ms-hint">${o.hint || ''}</span></div>`).join('')}
            </div>
          </div>
        </div>`;
      break;
    }
    // Other documents: an empty document-name field with its upload; "+ Add" adds another row.
    case 'extraDocs':
      control = `<div class="extra-docs">${extraDocRow(false, field.validity)}</div>
        <button type="button" class="btn btn-secondary btn-sm extra-doc-add" ${field.validity ? 'data-validity' : ''}>+ Add</button>`;
      break;
    // "+ Add document": type a document name, click Add, and a new upload field (with start / end date) appears.
    case 'addDocument':
      control = `<button type="button" class="btn btn-secondary btn-sm add-doc-btn">+ Add document</button>
        <div class="custom-term-row add-doc-row" hidden>
          <input class="add-doc-name" placeholder="Enter document name, e.g. Work authorization" />
          <button type="button" class="btn btn-primary btn-sm add-doc-confirm">Add</button>
          <button type="button" class="link-btn add-doc-cancel">Cancel</button>
        </div>`;
      break;
    case 'segmented':
      control = `<div class="segmented">${field.options.map((o, i) => `<button class="seg ${i === field.selected ? 'active' : ''}">${o}</button>`).join('')}</div>`;
      break;
    default:
      control = `<input value="${field.value || ''}" ${field.placeholder ? `placeholder="${field.placeholder}"` : ''} ${field.readonly ? 'readonly class="readonly"' : ''} />`;
  }

  // A field with showFor (like a section) appears only when that option is picked in the form's segmented control.
  const showFor = field.showFor ? ` data-show-for="${field.showFor}"${field.startHidden ? ' hidden' : ''}` : '';
  return `<div class="field ${field.full ? 'full' : ''}"${showFor}>${label}${control}${field.note ? `<span class="person-sub">${field.note}</span>` : ''}</div>`;
}

// One "other document" row: a document-name field plus its own upload box (and Remove on rows added later).
// Same three-column row as every other document: name (typed) + status | file | dates.
function extraDocRow(removable, validity) {
  const { file, dates } = uploadParts({ type: 'upload', validity });
  return `<div class="field doc-field extra-doc ${dates ? 'has-dates' : ''}">
      <div class="doc-name extra-doc-head">
        <input class="extra-doc-name" placeholder="Document name" aria-label="Document name" />
        <span class="doc-state">Not uploaded</span>
        ${removable ? '<button type="button" class="link-btn link-danger extra-doc-remove">Remove</button>' : ''}
      </div>
      <div class="doc-file">${file}</div>
      ${dates ? `<div class="doc-dates">${dates}</div>` : ''}
    </div>`;
}

function createForm(form, inModal = false) {
  if (!form) return '';
  // Sections with showFor appear only when that option is picked in the form's segmented control.
  const seg = form.sections.flatMap((s) => s.fields).find((f) => f.type === 'segmented');
  const selected = seg ? seg.options[seg.selected || 0] : null;
  return `
    <div class="form-card">
      ${form.sections.map((section) => `
        <div class="form-section" ${section.showFor ? `data-show-for="${section.showFor}" ${section.showFor !== selected ? 'hidden' : ''}` : ''}>
          <div class="section-head">
            <div class="section-title">${section.title}</div>
            ${section.hint ? `<div class="section-hint">${section.hint}</div>` : ''}
          </div>
          <div class="form-grid">${section.fields.map((f) => createField(f.showFor ? { ...f, startHidden: f.showFor !== selected } : f)).join('')}</div>
        </div>
      `).join('')}
      <div class="form-footer">
        <span class="person-sub inline"><span class="req">*</span> Required</span>
        <div class="form-buttons">
          ${form.delete ? `<button class="btn btn-secondary btn-delete" data-target="${form.delete.target}">${form.delete.label}</button>` : ''}
          ${form.cancel ? `<button type="button" class="btn btn-secondary" ${inModal ? 'data-modal-close' : `data-target="${form.cancel.target}"`}>${form.cancel.label}</button>` : ''}
          <button class="btn btn-primary" data-target="${form.submit.target}" ${form.submit.action ? `data-action="${form.submit.action}"` : ''}>${form.submit.label}</button>
        </div>
      </div>
    </div>
  `;
}

function createFooterActions(actions) {
  if (!actions) return '';
  return `<div class="form-buttons page-footer">${[...actions].reverse().map((a) => `<button type="button" class="btn ${a.primary ? 'btn-primary' : 'btn-secondary'}" ${a.action ? `data-action="${a.action}"` : `data-target="${a.target}"`}>${a.label}</button>`).join('')}</div>`;
}

function createDetail(detail) {
  if (!detail) return '';
  const docs = detail.documents;
  return `
    <div class="form-card">
      ${detail.sections.map((section) => `
        <div class="form-section">
          <div class="section-head"><div class="section-title">${section.title}</div></div>
          <div class="detail-grid">
            ${section.items.map((item) => `
              <div class="detail-item ${item.full ? 'full' : ''}">
                <div class="detail-label">${item.label}</div>
                <div class="detail-value">${item.value}</div>
              </div>`).join('')}
          </div>
        </div>
      `).join('')}
      ${docs ? `
        <div class="form-section detail-docs">
          <div class="section-head">
            <div class="section-title">${docs.title}</div>
            ${docs.hint ? `<div class="section-hint">${docs.hint}</div>` : ''}
          </div>
          <div class="table-card detail-docs-table">
            <div class="table-scroll">
              <table>
                <thead><tr>${docs.headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
                <tbody>${docs.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
              </table>
            </div>
          </div>
        </div>` : ''}
    </div>
  `;
}

// Read-only View pop-up built from an Edit form (View and Edit are separate actions; View never has an Edit button).
function formViewScreen(screen, editId, title) {
  let source = findScreenExact(editId);
  if (!source || !source.form) return screen;
  source = resolveScreenState(source);
  const valueOf = (f) => {
    if (f.type === 'upload') return f.file ? fileChip(f.file, f.size) : '<span class="person-sub inline">Not uploaded</span>';
    if (f.type === 'multiselect') return (f.selected || []).join(', ') || '—';
    if (f.type === 'select') return f.options[0];
    if (f.type === 'date') return f.value ? fmtDate(f.value) : '—';
    return f.value || '—';
  };
  return {
    ...screen,
    title,
    description: source.description ? 'Read-only view. Use Edit in the list to change it.' : '',
    detail: {
      sections: source.form.sections.map((sec) => ({
        title: sec.title,
        items: sec.fields.filter((f) => f.label && !['addDocument', 'extraDocs', 'segmented'].includes(f.type)).map((f) => ({ label: f.label, value: valueOf(f) }))
      }))
    }
  };
}

function resolveScreenState(screen) {
  if (screen.id === 'clientView') return formViewScreen(screen, 'clientEdit', 'Client');
  if (screen.id === 'vendorView') return formViewScreen(screen, 'vendorEdit', 'Vendor');
  if (screen.id === 'memberDetail') return memberDetailScreen(screen, selectedMember);
  if (screen.id === 'memberEdit') return memberEditScreen(screen, selectedMember);
  if (screen.id === 'memberSubmissions') return memberSubmissionsScreen(screen, selectedMember);
  if (screen.id === 'submitOnBehalf') return submitOnBehalfScreen(screen, selectedMember);
  if (screen.id === 'invoiceView') return invoiceViewScreen(screen, selectedInvoice);
  if (screen.id === 'clientAdd' || screen.id === 'clientEdit') return clientFormScreen(screen);
  if (screen.id === 'clients' && activePersona === 'superadmin') return { ...screen, table: clientsTable(screen.table) };
  if (screen.id === 'documentTracker' || (screen.id === 'docs' && activePersona === 'accountmanager')) return { ...screen, table: trackerTable(screen.table) };
  if (screen.id === 'docDetail') return docDetailScreen(screen, selectedDoc);
  if (screen.id === 'vendorInvoices') return { ...screen, table: vendorInvoicesTable(screen.table) };
  if (screen.id === 'invoiceReview') return invoiceReviewScreen(screen, selectedRec);
  if (screen.id === 'clientInvoices') return clientInvoicesScreen(screen);
  if (screen.id === 'invoiceDetail') return invoiceDetailScreen(screen, selectedInv);
  if (screen.id === 'invoiceUpdate') return invoiceUpdateScreen(screen, selectedInv);
  if (screen.id === 'adminUsers') return adminUsersScreen(screen);
  if (screen.id === 'adminUserAdd') return adminUserAddScreen(screen);
  if (screen.id === 'adminUserEdit') return adminUserEditScreen(screen);
  if (screen.id === 'invoiceUpload') return invoiceManagementScreen(screen);
  return screen;
}

function screenMarkup(screen) {
  return `
    <div class="screen">
      <div class="screen-head">
        <p class="screen-desc">${screen.description}</p>
        <div class="screen-actions">${actionButtons(screen.actions)}</div>
      </div>
      ${createAlert(screen.alert)}
      ${createKpiRow(screen.kpis)}
      ${createPanels(screen.panels)}
      ${createActivity(screen.activity)}
      ${createFilters(screen.filters)}
      ${createTabs(screen.tabs)}
      ${createTable(screen.table)}
      ${createDetail(screen.detail)}
      ${createForm(screen.form)}
      ${createFooterActions(screen.footerActions)}
    </div>
  `;
}

function modalMarkup(screen) {
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" tabindex="-1">
        <div class="modal-head">
          <div>
            <h2 class="modal-title" id="modalTitle">${screen.title}</h2>
            ${screen.description ? `<p class="modal-desc">${screen.description}</p>` : ''}
          </div>
          <button type="button" class="modal-close" data-modal-close aria-label="Close">×</button>
        </div>
        <div class="modal-body">
          ${createAlert(screen.alert)}
          ${screen.form
            ? createForm(screen.form, true)
            : `<div class="modal-content">${screen.custom || ''}${createTable(screen.table)}${createDetail(screen.detail)}</div>
               <div class="form-footer modal-footer"><span></span><div class="form-buttons">
                 <button type="button" class="btn ${(screen.actions && screen.actions.length) || screen.custom ? 'btn-secondary' : 'btn-primary'}" data-modal-close>Close</button>
                 ${actionButtons(screen.actions)}
               </div></div>`}
        </div>
      </div>
    </div>
  `;
}

const customTerms = [];
const UPLOAD_TYPES = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

function fmtSize(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// Dates are always entered and shown month / day / year, whatever the browser's regional settings.
const isoToMdy = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(0, 4)}` : '');
function mdyToIso(mdy) {
  const m = (mdy || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [mo, d, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
const CALENDAR_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';

// Swap each native date input for an MM/DD/YYYY text box plus a calendar button; the native input stays (hidden) as the value holder.
function upgradeDateInputs(root) {
  root.querySelectorAll('input[type="date"]:not([data-mdy])').forEach((native) => {
    native.dataset.mdy = '1';
    native.tabIndex = -1;
    native.classList.add('date-native');
    const wrap = document.createElement('div');
    wrap.className = 'date-field';
    native.parentNode.insertBefore(wrap, native);
    const text = document.createElement('input');
    text.type = 'text';
    text.className = 'date-text';
    text.placeholder = 'MM/DD/YYYY';
    text.inputMode = 'numeric';
    text.maxLength = 10;
    text.value = isoToMdy(native.value);
    const pick = document.createElement('button');
    pick.type = 'button';
    pick.className = 'date-pick';
    pick.setAttribute('aria-label', 'Pick a date');
    pick.title = 'Pick a date';
    pick.innerHTML = CALENDAR_ICON;
    wrap.append(text, pick, native);
    const note = () => wrap.parentElement.querySelector(':scope > .date-error');
    const setError = (msg) => {
      note()?.remove();
      if (msg) wrap.insertAdjacentHTML('afterend', `<span class="field-note date-error">${msg}</span>`);
    };
    pick.addEventListener('click', () => { try { native.showPicker(); } catch (e) { native.focus(); } });
    native.addEventListener('change', () => { text.value = isoToMdy(native.value); setError(''); });
    text.addEventListener('input', () => {
      // Type digits only; slashes are added as you go (MM/DD/YYYY).
      const digits = text.value.replace(/\D/g, '').slice(0, 8);
      text.value = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
    });
    text.addEventListener('change', () => {
      if (!text.value) { native.value = ''; setError(''); return; }
      const iso = mdyToIso(text.value);
      if (iso) { native.value = iso; setError(''); } else setError('Enter a valid date as MM/DD/YYYY.');
    });
  });
}

function wireFormControls(root) {
  upgradeDateInputs(root);
  // Segmented control (e.g. W-2 Employee / 1099 Contractor) switches the matching document section.
  root.querySelectorAll('.segmented').forEach((group) => {
    group.querySelectorAll('.seg').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        group.querySelectorAll('.seg').forEach((b) => b.classList.toggle('active', b === btn));
        const form = group.closest('.form-card');
        form?.querySelectorAll('[data-show-for]').forEach((section) => {
          section.hidden = section.dataset.showFor !== btn.textContent.trim();
        });
      });
    });
  });

  // Upload boxes open a real file picker and list the chosen files (PDF/DOCX/JPG/JPEG/PNG, max 5 MB each).
  root.querySelectorAll('.upload-box').forEach((box) => {
    const input = box.querySelector('.upload-input');
    if (!input) return;
    const list = box.nextElementSibling;
    const multiple = box.hasAttribute('data-multiple');
    // "Uploaded / Not uploaded" badge on the document row follows the chosen files.
    const syncState = () => {
      const state = box.closest('.doc-field')?.querySelector('.doc-state');
      if (!state) return;
      const has = !!list.querySelector('.upload-done');
      state.textContent = has ? 'Selected' : 'Not uploaded';
      state.classList.toggle('ok', has);
    };
    new MutationObserver(syncState).observe(list, { childList: true });
    box.addEventListener('click', () => input.click());
    box.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('change', () => {
      if (!multiple) list.innerHTML = '';
      [...input.files].forEach((file) => {
        const ext = file.name.split('.').pop().toLowerCase();
        const row = document.createElement('div');
        if (!UPLOAD_TYPES.includes(ext)) {
          row.className = 'upload-error';
          row.textContent = `${file.name}: only PDF, DOCX, JPG, JPEG or PNG files are allowed.`;
        } else if (file.size > UPLOAD_MAX_BYTES) {
          row.className = 'upload-error';
          row.textContent = `${file.name} is ${fmtSize(file.size)}. The limit is 5 MB per file.`;
        } else {
          row.className = 'upload-done';
          row.dataset.file = file.name;
          row.innerHTML = `${fileChip(file.name, fmtSize(file.size))}<button type="button" class="link-btn">Remove</button>`;
          row.querySelector('button').addEventListener('click', () => row.remove());
        }
        list.appendChild(row);
      });
      input.value = '';
    });
  });

  // Multi-select dropdowns (e.g. Clients on Add / Edit Account Manager).
  root.querySelectorAll('.ms').forEach((ms) => {
    const toggle = ms.querySelector('.ms-toggle');
    const panel = ms.querySelector('.ms-panel');
    const summary = ms.querySelector('.ms-summary');
    const search = ms.querySelector('.ms-search');
    const boxes = [...ms.querySelectorAll('input[type=checkbox]')];
    const paint = () => {
      const picked = boxes.filter((b) => b.checked).map((b) => b.value);
      summary.innerHTML = picked.length
        ? picked.map((v) => `<span class="chip ms-chip">${v}<span class="chip-x" data-remove="${v}" title="Remove">×</span></span>`).join('')
        : `<span class="ms-placeholder">${summary.dataset.placeholder}</span>`;
      summary.querySelectorAll('[data-remove]').forEach((x) => x.addEventListener('click', (e) => {
        e.stopPropagation();
        boxes.find((b) => b.value === x.dataset.remove).checked = false;
        paint();
      }));
    };
    const open = (yes) => { panel.hidden = !yes; toggle.setAttribute('aria-expanded', String(yes)); if (yes) search.focus(); };
    toggle.addEventListener('click', (e) => { e.stopPropagation(); open(panel.hidden); });
    ms.querySelectorAll('.ms-option').forEach((opt) => opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const box = opt.querySelector('input');
      if (e.target !== box) box.checked = !box.checked;
      paint();
    }));
    search.addEventListener('click', (e) => e.stopPropagation());
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      ms.querySelectorAll('.ms-option').forEach((opt) => { opt.hidden = !opt.textContent.toLowerCase().includes(q); });
    });
    document.addEventListener('click', (e) => { if (!ms.contains(e.target)) open(false); });
    paint();
  });

  // Admin User Management: Save and Send Invite / Save Changes validate, update the list and show a banner.
  root.querySelectorAll('[data-action="am-invite"], [data-action="am-save"]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      const form = btn.closest('.form-card');
      form.querySelectorAll('.field-error').forEach((n) => n.remove());
      const name = formValue(form, 'Full name');
      const email = formValue(form, 'Work email');
      const phone = formValue(form, 'Phone');
      const editing = btn.dataset.action === 'am-save';
      let ok = true;
      if (!name) { showFieldError(form, 'Full name', 'Enter the account manager’s name.'); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldError(form, 'Work email', 'Enter a valid email address.'); ok = false; }
      else if (ACCOUNT_MANAGERS.some((am, i) => am.email.toLowerCase() === email.toLowerCase() && !(editing && i === selectedAm))) {
        showFieldError(form, 'Work email', 'An account manager with this email already exists.'); ok = false;
      }
      const boxes = [...form.querySelectorAll('.ms input[type=checkbox]')];
      const picked = boxes.filter((b) => b.checked).map((b) => b.value);
      const removed = boxes.filter((b) => b.hasAttribute('data-initial') && !b.checked).map((b) => b.value);
      const oldName = editing ? ACCOUNT_MANAGERS[selectedAm].name : null;
      // A client may be removed only if another account manager still manages it.
      const orphaned = removed.filter((c) => CLIENT_AM[c].filter((n) => n !== oldName).length === 0);
      if (!picked.length) { showFieldError(form, 'Clients', 'Select at least one client for this account manager.'); ok = false; }
      if (orphaned.length) {
        showFieldError(form, 'Clients', `${orphaned.join(', ')} would be left without an account manager. Add another account manager to ${orphaned.length > 1 ? 'them' : 'it'} first.`);
        ok = false;
      }
      if (!ok) { event.stopPropagation(); return; } // stay on the form

      if (editing && oldName !== name) {
        Object.keys(CLIENT_AM).forEach((c) => { CLIENT_AM[c] = CLIENT_AM[c].map((n) => (n === oldName ? name : n)); });
      }
      removed.forEach((c) => { CLIENT_AM[c] = CLIENT_AM[c].filter((n) => n !== name); });
      // Add this account manager to each picked client, alongside any existing ones.
      const shared = [];
      picked.forEach((c) => {
        const others = CLIENT_AM[c].filter((n) => n !== name);
        if (!CLIENT_AM[c].includes(name)) {
          if (others.length) shared.push(`${c} (with ${others.join(', ')})`);
          CLIENT_AM[c].push(name);
        }
      });
      const added = picked.filter((c) => !boxes.find((b) => b.value === c).hasAttribute('data-initial')).length;
      const sharedText = shared.length ? ` Shared clients: ${shared.join(', ')}.` : '';

      if (editing) {
        const am = ACCOUNT_MANAGERS[selectedAm];
        Object.assign(am, { name, email, phone, status: formValue(form, 'Status') || am.status, clients: Math.max(0, am.clients + added - removed.length) });
        const changes = [added ? `${added} client${added > 1 ? 's' : ''} added` : '', removed.length ? `${removed.join(', ')} removed` : ''].filter(Boolean).join('; ');
        flashMessage = { title: 'Changes saved', text: `${name}’s details were updated.${changes ? ` ${changes}.` : ''}${sharedText}` };
      } else {
        ACCOUNT_MANAGERS.push({ name, email, phone: phone || '—', clients: picked.length, vendors: 0, status: 'Invited', lastLogin: '—' });
        flashMessage = {
          title: 'Invite sent',
          text: `${name} was added as an account manager for ${picked.join(', ')}. An invite to set their password was emailed to ${email} (link valid 72 hours).${sharedText}`
        };
      }
    });
  });

  // Submit on behalf: live invoice amount, validation, duplicate check (INV-8), then add to the person's submissions.
  root.querySelectorAll('[data-action="on-behalf"]').forEach((btn) => {
    const form = btn.closest('.form-card');
    const m = TEAM_MEMBERS[selectedMember];
    const w2 = m.type === 'W-2';
    const hoursLabel = w2 ? 'Total hours' : 'Total billed hours';
    const field = (label) => [...form.querySelectorAll('.field')].find((f) => f.querySelector('label')?.childNodes[0]?.textContent.trim() === label);
    const money = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const hoursInput = field(hoursLabel).querySelector('input');
    const amountInput = field('Invoice amount (USD)')?.querySelector('input');
    hoursInput.addEventListener('input', () => {
      const h = Number(hoursInput.value);
      if (amountInput) amountInput.value = money(h > 0 ? Math.round(h * Number(m.rate) * 100) / 100 : 0);
    });

    btn.addEventListener('click', (event) => {
      form.querySelectorAll('.field-error').forEach((n) => n.remove());
      const hours = Number(formValue(form, hoursLabel));
      const periodLong = formValue(form, 'Billing period');
      const period = `${periodLong.slice(0, 3)} ${periodLong.split(' ')[1]}`;
      const fileOf = (label) => field(label)?.querySelector('.upload-done[data-file]')?.dataset.file || '';
      const timesheet = fileOf('Timesheet');
      const invoice = w2 ? 'na' : fileOf('Invoice');
      const rows = MEMBER_SUBMISSIONS[selectedMember] || (MEMBER_SUBMISSIONS[selectedMember] = []);
      let ok = true;
      if (!(hours > 0 && hours <= 744)) { showFieldError(form, hoursLabel, 'Enter the total hours for the month (more than 0).'); ok = false; }
      if (!timesheet) { showFieldError(form, 'Timesheet', 'Upload the timesheet.'); ok = false; }
      if (!w2 && !invoice) { showFieldError(form, 'Invoice', 'Upload the invoice.'); ok = false; }
      // One invoice (or, for W-2, one timesheet) per person per month.
      if (rows.some((r) => r.period === period && r.ref !== '—' && r.status !== 'Rejected')) {
        showFieldError(form, 'Billing period', `${selectedMember} already has an active ${w2 ? 'timesheet' : 'invoice'} for ${periodLong}. Only one ${w2 ? 'timesheet' : 'invoice'} is allowed per month.`);
        ok = false;
      }
      if (!ok) { event.stopPropagation(); return; }

      const month = String(new Date(`${periodLong} 1`).getMonth() + 1).padStart(2, '0');
      const ref = `${w2 ? 'TS' : 'INV'}-2026-${month}-0${300 + Math.floor(Math.random() * 600)}`;
      const record = {
        period, client: m.client, ref, hours: String(hours),
        amount: w2 ? '—' : money(Math.round(hours * Number(m.rate) * 100) / 100),
        invoice, timesheet, status: 'In Progress', by: currentPersona().user.name
      };
      // A rejected submission for the same period is replaced by this one (kept as Superseded history).
      rows.forEach((r) => { if (r.period === period && r.client === m.client && r.status === 'Rejected') r.status = 'Superseded'; });
      // Replace a "Due" / "Not Started" placeholder for the same period, otherwise add on top.
      const placeholder = rows.findIndex((r) => r.period === period && r.client === m.client && r.ref === '—');
      if (placeholder >= 0) rows.splice(placeholder, 1, record); else rows.unshift(record);
      flashMessage = {
        title: `${w2 ? 'Timesheet' : 'Invoice'} submitted on behalf of ${selectedMember}`,
        text: `${ref} · ${m.client} · ${periodLong} · ${hours} h. It is In Progress until the client invoice is matched; reconciliation runs automatically.`
      };
    });
  });

  // Invoices: upload a missing invoice / timesheet straight from the table or the invoice page.
  root.querySelectorAll('.inv-upload').forEach((btn) => {
    const wrap = btn.parentElement;
    const input = wrap.querySelector('.upload-input');
    btn.addEventListener('click', (e) => { e.stopPropagation(); input.click(); });
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const ext = file.name.split('.').pop().toLowerCase();
      wrap.querySelector('.upload-error')?.remove();
      if (!UPLOAD_TYPES.includes(ext) || file.size > UPLOAD_MAX_BYTES) {
        const err = document.createElement('div');
        err.className = 'upload-error';
        err.textContent = !UPLOAD_TYPES.includes(ext) ? 'Only PDF, DOCX, JPG, JPEG or PNG.' : 'Max 5 MB per file.';
        wrap.appendChild(err);
        input.value = '';
        return;
      }
      const inv = INVOICES[btn.dataset.inv];
      inv[btn.dataset.kind] = file.name;
      flashMessage = { title: `${btn.dataset.kind === 'invoice' ? 'Invoice' : 'Timesheet'} uploaded`, text: `${file.name} added to ${btn.dataset.inv} (${inv.person}) on their behalf by ${currentPersona().user.name}.` };
      render();
    });
  });

  // Invoices: corrected / new / edited submission. Saving re-runs reconciliation against the client invoice hours.
  root.querySelectorAll('[data-action="inv-update"]').forEach((btn) => {
    const form = btn.closest('.form-card');
    const id = selectedInv;
    const inv = INVOICES[id];
    const mode = inv.status === 'Rejected' ? 'correct' : inv.status === 'Not Submitted' ? 'new' : 'edit';
    const field = (label) => [...form.querySelectorAll('.field')].find((f) => f.querySelector('label')?.childNodes[0]?.textContent.trim() === label);
    const hoursInput = field('Total billed hours').querySelector('input');
    const amountInput = field('Invoice amount (USD)')?.querySelector('input');
    hoursInput.addEventListener('input', () => {
      const h = Number(hoursInput.value);
      if (amountInput) amountInput.value = usd(h > 0 ? Math.round(h * inv.rate * 100) / 100 : 0);
    });

    btn.addEventListener('click', (event) => {
      form.querySelectorAll('.field-error').forEach((n) => n.remove());
      const hours = Number(hoursInput.value);
      const fileOf = (label) => field(label)?.querySelector('.upload-done[data-file]')?.dataset.file || '';
      const newInvoice = inv.w2 ? '' : fileOf('Invoice');
      const newTimesheet = fileOf('Timesheet');
      let ok = true;
      if (!(hours > 0 && hours <= 744)) { showFieldError(form, 'Total billed hours', 'Enter the total hours for the month (more than 0).'); ok = false; }
      if (mode !== 'edit') {
        if (!inv.w2 && !newInvoice) { showFieldError(form, 'Invoice', `Upload the ${mode === 'correct' ? 'corrected ' : ''}invoice.`); ok = false; }
        if (!newTimesheet) { showFieldError(form, 'Timesheet', 'Upload the timesheet.'); ok = false; }
      }
      if (!ok) { event.stopPropagation(); return; }

      const me = currentPersona().user.name;
      if (newInvoice) inv.invoice = newInvoice;
      if (newTimesheet) inv.timesheet = newTimesheet;
      inv.hours = hours;
      const version = (Number((inv.submitted.match(/\(v(\d+)\)/) || [])[1]) || 1) + (mode === 'new' ? 0 : 1);
      inv.submitted = mode === 'new' ? 'Today' : `Today (v${version})`;
      if (mode !== 'edit') inv.by = me;
      // Reconciliation: exact match on total hours once the client invoice is in.
      if (inv.clientHours == null) inv.status = 'In Progress';
      else inv.status = hours === inv.clientHours ? 'Approved' : 'Rejected';

      // A first submission gets its own invoice / timesheet number.
      let shownId = id;
      if (mode === 'new') {
        shownId = `${inv.w2 ? 'TS' : 'INV'}-2026-10-0${300 + Math.floor(Math.random() * 600)}`;
        INVOICES[shownId] = inv;
        delete INVOICES[id];
        INVOICE_ALIASES[id] = shownId;
        [AUDIT_INVOICE_IDS, VENDOR_INVOICE_IDS].forEach((list) => { const i = list.indexOf(id); if (i >= 0) list[i] = shownId; });
        selectedInv = shownId;
      }

      const what = inv.w2 ? 'Timesheet' : 'Invoice';
      const result = inv.status === 'Approved' ? 'Reconciliation matched the client invoice — Approved.'
        : inv.status === 'Rejected' ? `Reconciliation rejected it: expected ${inv.clientHours} hours, submitted ${hours}.`
          : 'In Progress until the client invoice is uploaded.';
      flashMessage = {
        title: mode === 'edit' ? `${id} updated` : mode === 'correct' ? `Corrected ${what.toLowerCase()} submitted for ${inv.person}` : `${what} ${shownId} submitted for ${inv.person}`,
        text: `${hours} h for ${inv.client}, ${inv.period}. ${result}${mode === 'correct' ? ' The rejected version is kept as Superseded.' : ''}`
      };
    });
  });

  // Invoice Management: Client / Status filters re-draw the list (the tab picks Vendor Consultants, W-2 or 1099).
  if (activeScreen === 'invoiceUpload' || (activeScreen === 'invoiceReview' && modalBase?.screen === 'invoiceUpload')) {
    root.querySelector('select[data-filter="Client"]')?.addEventListener('change', (e) => { selectedClientInvoiceClient = e.target.value; render(); refreshNavState(); });
    root.querySelector('select[data-filter="Status"]')?.addEventListener('change', (e) => { imStatusFilter = e.target.value; render(); refreshNavState(); });
  }

  // Client invoice pop-up: pick a file per person, enter hours, then "Save client invoices".
  if (activeScreen === 'clientInvoices') {
    const modal = root.querySelector('.modal');
    modal?.querySelectorAll('.ci-up').forEach((btn) => {
      const wrap = btn.parentElement;
      const input = wrap.querySelector('.upload-input');
      btn.addEventListener('click', (e) => { e.stopPropagation(); input.click(); });
      input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        wrap.querySelector('.upload-error')?.remove();
        if (!UPLOAD_TYPES.includes(ext) || file.size > UPLOAD_MAX_BYTES) {
          wrap.insertAdjacentHTML('beforeend', `<div class="upload-error">${!UPLOAD_TYPES.includes(ext) ? 'Only PDF, DOCX, JPG, JPEG or PNG.' : 'Max 5 MB per file.'}</div>`);
          input.value = '';
          return;
        }
        ciPending[btn.dataset.rec] = file.name;
        wrap.outerHTML = `<div class="doc-cell">${fileChip(file.name, fmtSize(file.size))}</div>`; // keep typed hours: no re-render
      });
    });
    modal?.querySelector('[data-ci="save"]')?.addEventListener('click', () => {
      modal.querySelectorAll('.ci-row-error').forEach((e) => e.remove());
      let saved = 0;
      let problems = 0;
      modal.querySelectorAll('.ci-h').forEach((input) => {
        const id = input.dataset.rec;
        const rec = IM_RECORDS[id];
        const hours = Number(input.value);
        const file = ciPending[id];
        if (!file && !input.value.trim()) return; // nothing entered for this person
        const msg = !file ? 'Upload the client invoice.' : !(hours > 0) ? 'Enter the billable hours.' : '';
        if (msg) { problems++; input.insertAdjacentHTML('afterend', `<span class="field-note ci-row-error">${msg}</span>`); return; }
        rec.clientInvoice = file;
        rec.clientHours = hours;
        delete ciPending[id];
        if (rec.inv && INVOICES[rec.inv]) INVOICES[rec.inv].clientHours = hours;
        saved++;
      });
      if (problems) return;
      if (!saved) { showToast({ tone: 'error', title: 'Nothing to save', text: 'Upload a client invoice and enter its billable hours first.' }); return; }
      showToast({ title: `${saved} client invoice${saved > 1 ? 's' : ''} saved`, text: 'Ready for review in Invoice Management once the vendor or resource side is in.' });
      render();
    });
  }

  // Review pop-up: live hours check, save a missing client invoice, Approve, or Reject with a reason.
  if (activeScreen === 'invoiceReview') {
    const rec = IM_RECORDS[selectedRec];
    const modal = root.querySelector('.modal');
    const clientHoursInput = modal.querySelector('.rv-client-hours');
    const matchBox = modal.querySelector('[data-match]');
    clientHoursInput?.addEventListener('input', () => {
      if (!rec.clientInvoice || !rec.doc) return;
      const v = Number(clientHoursInput.value);
      const ok = v === rec.docHours;
      matchBox.className = `review-match ${ok ? 'ok' : 'bad'}`;
      matchBox.textContent = ok ? `Hours match: ${v} h on both.` : `Hours do not match: client ${clientHoursInput.value || '—'} h, ${rec.type === 'Consultant' ? 'vendor' : 'resource'} ${rec.docHours} h.`;
    });
    const linked = () => (rec.inv ? INVOICES[rec.inv] : null);
    const sync = () => {
      const inv = linked();
      if (!inv) return;
      inv.clientHours = rec.clientHours;
      inv.status = imStatus(rec) === 'In Progress' && inv.status === 'Not Submitted' ? 'Not Submitted' : imStatus(rec);
      inv.reason = rec.reason;
    };
    const backToList = (message) => {
      imRejecting = false;
      flashMessage = message;
      goToScreen('invoiceUpload', undefined, IM_TAB_TYPES.indexOf(rec.type));
    };
    modal.querySelector('[data-rv="save-client"]')?.addEventListener('click', () => {
      const file = modal.querySelector('.review-doc .upload-done[data-file]')?.dataset.file;
      const hours = Number(clientHoursInput.value);
      modal.querySelectorAll('.field-error').forEach((e) => e.remove());
      const err = (el, text) => el.insertAdjacentHTML('afterend', `<span class="field-note field-error">${text}</span>`);
      if (!file) err(modal.querySelector('.review-doc .upload-box'), 'Upload the client invoice.');
      if (!(hours > 0)) err(clientHoursInput, 'Enter the client billable hours.');
      if (!file || !(hours > 0)) return;
      rec.clientInvoice = file;
      rec.clientHours = hours;
      sync();
      showToast({ title: 'Client invoice saved', text: rec.doc ? 'Both documents are in. Review the hours and approve or reject.' : `Still waiting for the ${imDocLabel(rec).toLowerCase()}.` });
      render();
    });
    modal.querySelector('[data-rv="approve"]')?.addEventListener('click', () => {
      const v = Number(clientHoursInput.value);
      if (v > 0) rec.clientHours = v;
      rec.review = 'Approved';
      rec.reason = '';
      sync();
      backToList({ title: `Approved · ${rec.person}`, text: `Client ${rec.clientHours} h and ${rec.type === 'Consultant' ? 'vendor' : 'resource'} ${rec.docHours} h for ${IM_PERIOD}.` });
    });
    modal.querySelector('[data-rv="reject"]')?.addEventListener('click', () => {
      imRejecting = true;
      modal.querySelector('.review-reject').hidden = false;
      modal.querySelector('.rv-reason').focus();
    });
    modal.querySelector('[data-rv="cancel-reject"]')?.addEventListener('click', () => {
      imRejecting = false;
      modal.querySelector('.review-reject').hidden = true;
    });
    modal.querySelector('[data-rv="submit-reject"]')?.addEventListener('click', () => {
      const box = modal.querySelector('.rv-reason');
      modal.querySelectorAll('.review-reject .field-error').forEach((e) => e.remove());
      if (!box.value.trim()) {
        box.insertAdjacentHTML('afterend', '<span class="field-note field-error">Enter the reason for rejection.</span>');
        box.focus();
        return;
      }
      const v = Number(clientHoursInput.value);
      if (v > 0) rec.clientHours = v;
      rec.review = 'Rejected';
      rec.reason = box.value.trim();
      sync();
      backToList({ tone: 'warning', title: `Rejected · ${rec.person}`, text: `The ${rec.type === 'Consultant' ? 'vendor' : 'resource'} has been asked to correct and resubmit. Reason: ${rec.reason}` });
    });
  }

  // Document Tracker / profile documents: Remind and Request answer with a toast (success, or failure if already sent today).
  root.querySelectorAll('.doc-notify').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const d = btn.dataset.doc ? DOCUMENTS[btn.dataset.doc] : { owner: btn.dataset.owner, name: btn.dataset.docname };
      const remind = btn.dataset.kind === 'remind';
      const key = `${btn.dataset.kind}|${d.owner}|${d.name}`;
      if (sentNotifications.has(key)) {
        showToast({
          tone: 'error',
          title: remind ? 'Reminder not sent' : 'Request not sent',
          text: `${d.owner} was already ${remind ? 'reminded about' : 'asked for'} the ${d.name} today. You can send another tomorrow.`
        });
        return;
      }
      sentNotifications.add(key);
      showToast(remind
        ? { title: 'Reminder sent', text: `${d.owner} and their account manager were reminded to upload a new version of the ${d.name}.` }
        : { title: 'Request sent', text: `${d.owner} was asked to upload the ${d.name}.` });
    });
  });

  // Add / Edit Client (Super Admin): at least one account manager; update CLIENT_AM and the managers' client counts.
  root.querySelectorAll('[data-action="client-save"]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      const form = btn.closest('.form-card');
      form.querySelectorAll('.field-error').forEach((n) => n.remove());
      const client = clientNameOf(form);
      const boxes = [...form.querySelectorAll('.ms input[type=checkbox]')];
      const picked = boxes.filter((b) => b.checked).map((b) => b.value);
      if (!client) { showFieldError(form, 'Client name', 'Enter the client name.'); event.stopPropagation(); return; }
      if (!picked.length) { showFieldError(form, 'Account managers', 'Select at least one account manager for this client.'); event.stopPropagation(); return; }
      const before = CLIENT_AM[client] || [];
      picked.filter((n) => !before.includes(n)).forEach((n) => { const a = ACCOUNT_MANAGERS.find((x) => x.name === n); if (a) a.clients += 1; });
      before.filter((n) => !picked.includes(n)).forEach((n) => { const a = ACCOUNT_MANAGERS.find((x) => x.name === n); if (a) a.clients = Math.max(0, a.clients - 1); });
      CLIENT_AM[client] = picked;
      flashMessage = {
        title: activeScreen === 'clientEdit' ? 'Client updated' : 'Client saved',
        text: `${client} is managed by ${picked.join(', ')}.`
      };
    });
  });

  root.querySelectorAll('.am-resend').forEach((btn) => {
    btn.addEventListener('click', () => {
      const am = ACCOUNT_MANAGERS[Number(btn.dataset.am)];
      flashMessage = { title: 'Invite re-sent', text: `A new invite link was emailed to ${am.email}. The previous link no longer works.` };
      goToScreen('adminUsers');
    });
  });

  // Delete asks for confirmation; clients and vendors must be reassigned to another account manager first.
  root.querySelectorAll('.am-delete').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.am);
      const am = ACCOUNT_MANAGERS[i];
      const cell = btn.closest('[data-am-row]');
      const others = ACCOUNT_MANAGERS.filter((x, j) => j !== i && x.status === 'Active');
      const needsReassign = am.clients + am.vendors > 0;
      cell.classList.add('confirm-delete');
      if (needsReassign && !others.length) {
        cell.innerHTML = '<span class="confirm-text">No active account manager to take over their clients and vendors.</span><button type="button" class="link-btn am-cancel">OK</button>';
        cell.querySelector('.am-cancel').addEventListener('click', () => goToScreen('adminUsers'));
        return;
      }
      cell.innerHTML = `
        <span class="confirm-text">${needsReassign ? `Reassign ${am.clients} clients &amp; ${am.vendors} vendors to` : `Delete ${am.name}?`}</span>
        ${needsReassign ? `<select class="am-reassign">${others.map((o) => `<option>${o.name}</option>`).join('')}</select>` : ''}
        <button type="button" class="btn btn-sm btn-danger am-confirm">Delete</button>
        <button type="button" class="link-btn am-cancel">Cancel</button>`;
      cell.querySelector('.am-cancel').addEventListener('click', () => goToScreen('adminUsers'));
      cell.querySelector('.am-confirm').addEventListener('click', () => {
        let text = `${am.name} can no longer sign in.`;
        const takeover = needsReassign ? cell.querySelector('.am-reassign').value : null;
        Object.keys(CLIENT_AM).forEach((c) => {
          if (!CLIENT_AM[c].includes(am.name)) return;
          CLIENT_AM[c] = CLIENT_AM[c].filter((n) => n !== am.name);
          if (takeover && !CLIENT_AM[c].includes(takeover)) CLIENT_AM[c].push(takeover);
        });
        if (needsReassign) {
          const toName = takeover;
          const to = ACCOUNT_MANAGERS.find((x) => x.name === toName);
          to.clients += am.clients;
          to.vendors += am.vendors;
          text += ` Their ${am.clients} clients and ${am.vendors} vendors now belong to ${toName}.`;
        }
        ACCOUNT_MANAGERS.splice(i, 1);
        flashMessage = { title: 'Account manager deleted', text };
        goToScreen('adminUsers');
      });
    });
  });

  // Upload buttons inside table cells (e.g. a missing invoice or timesheet): pick a file, then show it in the cell.
  root.querySelectorAll('.cell-upload').forEach((btn) => {
    const wrap = btn.parentElement;
    const input = wrap.querySelector('.upload-input');
    btn.addEventListener('click', (e) => { e.stopPropagation(); input.click(); });
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const ext = file.name.split('.').pop().toLowerCase();
      wrap.querySelector('.upload-error')?.remove();
      if (!UPLOAD_TYPES.includes(ext) || file.size > UPLOAD_MAX_BYTES) {
        const err = document.createElement('div');
        err.className = 'upload-error';
        err.textContent = !UPLOAD_TYPES.includes(ext) ? 'Only PDF, DOCX, JPG, JPEG or PNG.' : 'Max 5 MB per file.';
        wrap.appendChild(err);
        input.value = '';
        return;
      }
      wrap.outerHTML = `<div class="doc-cell">${fileChip(file.name, fmtSize(file.size))}<button type="button" class="link-btn" data-preview="${file.name}">View</button></div><span class="person-sub inline">Uploaded by you · just now</span>`;
    });
  });

  // Select with an "add your own" option (Work location → "Location"): picking it reveals a field;
  // Add (or Enter) puts the typed value into the dropdown and selects it.
  root.querySelectorAll('select[data-add-option]').forEach((select) => {
    const field = select.parentElement;
    const row = field.querySelector('.add-option-row');
    const input = row.querySelector('.add-option-input');
    const trigger = select.dataset.addOption;
    let previous = select.value;
    const close = () => { row.hidden = true; input.value = ''; };
    const save = () => {
      const value = input.value.trim();
      if (!value) { input.focus(); return; }
      let option = [...select.options].find((o) => o.value === value);
      if (!option) {
        option = new Option(value, value);
        select.insertBefore(option, [...select.options].find((o) => o.value === trigger));
      }
      select.value = value;
      previous = value;
      close();
    };
    select.addEventListener('change', () => {
      if (select.value === trigger) { row.hidden = false; input.focus(); }
      else { previous = select.value; close(); }
    });
    row.querySelector('.add-option-btn').addEventListener('click', save);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); save(); }
      if (e.key === 'Escape') { close(); select.value = previous; }
    });
  });

  // Other documents: "+ Add" appends another name + upload row; Remove deletes an added row.
  root.querySelectorAll('.extra-doc-add').forEach((btn) => {
    const list = btn.closest('.field').querySelector('.extra-docs');
    btn.addEventListener('click', () => {
      list.insertAdjacentHTML('beforeend', extraDocRow(true, btn.hasAttribute('data-validity')));
      const row = list.lastElementChild;
      row.querySelector('.extra-doc-remove').addEventListener('click', () => row.remove());
      wireFormControls(row);
      row.querySelector('.extra-doc-name').focus();
    });
  });

  // "+ Add document": enter a name, Add creates an upload field for it with start / end dates and a Remove link.
  root.querySelectorAll('.add-doc-btn').forEach((btn) => {
    const holder = btn.closest('.field');
    const row = holder.querySelector('.add-doc-row');
    const input = row.querySelector('.add-doc-name');
    const open = () => { btn.hidden = true; row.hidden = false; input.focus(); };
    const close = () => { row.hidden = true; btn.hidden = false; input.value = ''; };
    const add = () => {
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      holder.insertAdjacentHTML('beforebegin', createField({ label: name, type: 'upload', validity: true }));
      const added = holder.previousElementSibling;
      added.classList.add('added-doc');
      added.querySelector('label').insertAdjacentHTML('beforeend', '<button type="button" class="link-btn add-doc-remove">Remove</button>');
      added.querySelector('.add-doc-remove').addEventListener('click', () => added.remove());
      wireFormControls(added);
      close();
    };
    btn.addEventListener('click', open);
    row.querySelector('.add-doc-confirm').addEventListener('click', add);
    row.querySelector('.add-doc-cancel').addEventListener('click', close);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); add(); }
      if (e.key === 'Escape') close();
    });
  });

  // Payment term "Custom" reveals a field for a term such as Net 10. Saving it (Add, Enter, or leaving the
  // field) adds it to the dropdown, selects it, and offers it in every payment-term dropdown afterwards.
  root.querySelectorAll('select[data-custom-select]').forEach((select) => {
    const field = select.parentElement;
    const row = field.querySelector('.custom-term-row');
    const input = field.querySelector('.custom-term');
    const note = field.querySelector('.field-note');
    let previous = select.value;

    const close = () => { row.hidden = true; note.hidden = true; input.value = ''; };
    const save = () => {
      const value = input.value.trim();
      if (!value) return false;
      const match = value.match(/^net\s*(\d{1,3})$/i);
      if (!match) { note.hidden = false; return false; }
      const term = `Net ${Number(match[1])}`;
      if (!customTerms.includes(term)) customTerms.push(term);
      let option = [...select.options].find((o) => o.value === term);
      if (!option) {
        option = new Option(term, term);
        select.insertBefore(option, [...select.options].find((o) => o.value === 'Custom'));
      }
      select.value = term;
      previous = term;
      close();
      return true;
    };

    select.addEventListener('change', () => {
      if (select.value === 'Custom') {
        row.hidden = false;
        input.focus();
      } else {
        previous = select.value;
        close();
      }
    });
    field.querySelector('.custom-term-add').addEventListener('click', save);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); save(); }
      if (e.key === 'Escape') { close(); select.value = previous; }
    });
    // Leaving the field with a valid term saves it too, so clicking the form's Save right after typing works.
    input.addEventListener('blur', (e) => {
      if (e.relatedTarget && e.relatedTarget.classList.contains('custom-term-add')) return;
      save();
    });
  });
}

function handleTargetClick(event) {
  const trigger = event.target.closest('[data-target]');
  if (!trigger) return;
  const target = trigger.getAttribute('data-target');
  const clientName = trigger.getAttribute('data-client');
  const memberName = trigger.getAttribute('data-member');
  if (memberName) selectedMember = memberName;
  const invoiceId = trigger.getAttribute('data-invoice');
  if (invoiceId) selectedInvoice = invoiceId;
  const invId = trigger.getAttribute('data-inv');
  if (invId) {
    selectedInv = invId;
    if (['invoiceAudit', 'vendorInvoices', 'invoices'].includes(activeScreen)) invoiceReturn = activeScreen;
  }
  const docId = trigger.getAttribute('data-doc');
  if (docId) selectedDoc = docId;
  const recId = trigger.getAttribute('data-rec');
  if (recId) { selectedRec = recId; imRejecting = false; }
  // Dashboard bars open Invoice Management filtered to that status.
  const statusFilter = trigger.getAttribute('data-status');
  if (statusFilter) { imStatusFilter = statusFilter; selectedClientInvoiceClient = 'All clients'; }
  const amIndex = trigger.getAttribute('data-am');
  if (amIndex !== null) selectedAm = Number(amIndex);
  const resolved = target && resolveTarget(target);
  if (resolved) {
    goToScreen(resolved, clientName || undefined, Number(trigger.getAttribute('data-tab')) || 0);
  }
}

function render() {
  let screen = applyActiveTab(resolveScreenState(findScreen(activeScreen)));
  activeScreen = screen.id;
  if (flashMessage) {
    screen = { ...screen, alert: { ...flashMessage, tone: flashMessage.tone || 'success' } };
    flashMessage = null;
  }

  // Pop-up forms: draw the screen they were opened from, with the form in a dialog on top.
  const modal = isModalId(screen.id) ? screen : null;
  let page = screen;
  if (modal) {
    const baseId = (modalBase && modalBase.screen && !isModalId(modalBase.screen)) ? modalBase.screen : (screen.parent || 'dashboard');
    const keepTab = activeTab;
    activeTab = (modalBase && modalBase.tab) || 0;
    page = applyActiveTab(resolveScreenState(findScreen(baseId)));
    activeTab = keepTab;
  }

  renderLeftNav(page);
  renderPersonaButtons();
  renderUser();
  renderBreadcrumb(page);

  pageTitle.textContent = page.title;
  document.title = `${screen.title} · Arkhya Tech VMS`;
  screenContainer.innerHTML = screenMarkup(page) + (modal ? modalMarkup(modal) : '');
  document.body.classList.toggle('modal-open', !!modal);
  if (modal) {
    const backdrop = screenContainer.querySelector('[data-modal-backdrop]');
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
    backdrop.querySelectorAll('[data-modal-close]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); }));
    backdrop.querySelector('.modal').focus({ preventScroll: true });
  }
  screenContainer.onclick = handleTargetClick;
  wireFormControls(screenContainer);
  screenContainer.querySelectorAll('.tab[data-tab-index]').forEach((tab) => {
    tab.addEventListener('click', () => { activeTab = Number(tab.dataset.tabIndex); render(); refreshNavState(); });
  });

  breadcrumb.onclick = handleTargetClick;
  breadcrumb.querySelector('.back-btn')?.addEventListener('click', (e) => { e.stopPropagation(); goBack(screen); });

  screenContainer.querySelectorAll('.chip-x').forEach((closeBtn) => {
    closeBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      event.currentTarget.parentElement.remove();
    });
  });

  screenContainer.querySelectorAll('.tab, .seg').forEach((el) => {
    el.addEventListener('click', () => {
      el.parentElement.querySelectorAll('.active').forEach((a) => a.classList.remove('active'));
      el.classList.add('active');
    });
  });
}

/* View and Edit links are shown as icons everywhere (eye = View, pencil = Edit); the word stays as the tooltip and accessible name. */
const ACTION_ICONS = {
  View: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  Edit: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>'
};
function iconizeActions(root) {
  root.querySelectorAll('button.link-btn:not(.icon-btn)').forEach((btn) => {
    const word = btn.textContent.trim();
    if (!ACTION_ICONS[word] || btn.children.length) return;
    btn.classList.add('icon-btn');
    btn.setAttribute('aria-label', word);
    btn.title = word;
    btn.innerHTML = ACTION_ICONS[word];
  });
}
// Also catches links added after a render (e.g. a View link that appears after an upload).
new MutationObserver(() => iconizeActions(screenContainer)).observe(screenContainer, { childList: true, subtree: true });

render();
