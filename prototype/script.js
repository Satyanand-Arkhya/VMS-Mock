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
    'Holiday Calendar': 'clientHolidayCalendar',
    'Client invoice': 'invoiceUpload',
    'Vendor Invoice': 'vendorInvoices',
    'Consultants': 'vendorConsultants',
    'Open': 'clientEdit',
    'Holidays': 'clientHolidayCalendar',
    'View': 'clients',
    'Edit': 'clientEdit',
    'View all': 'dashboard',
    'Correct': 'invoiceAudit'
  };

  return `<div class="row-actions">${labels.map((l) => `<button class="link-btn" data-target="${targets[l] || 'dashboard'}">${l}</button>`).join('')}</div>`;
}

function clientInvoiceAction(clientName) {
  return `<button class="link-btn" data-target="invoiceUpload" data-client="${clientName}">Client invoice</button>`;
}

function getClientInvoiceRows(clientName) {
  const rowsByClient = {
    'Blue Harbor Health': [
      [person('Deepa Kumar', 'Coral Staffing'), 'Consultant', '160', fileChip('BH-Oct26-Kumar.pdf', '420 KB'), '<input class="cell-input" value="168" />', b('Rejected')],
      [person('Kevin Singh', 'Summit IT'), 'Consultant', '160', fileChip('BH-Oct26-Singh.pdf', '418 KB'), '<input class="cell-input" value="152" />', b('Rejected')],
      [person('Lena Fischer', 'Summit IT'), 'Consultant', '168', '<button class="upload-mini">Upload</button>', '<input class="cell-input" placeholder="0" />', b('Awaiting Client Invoice')],
      [person('Omar Haddad', 'Coral Staffing'), 'Consultant', '144', '<button class="upload-mini">Upload</button>', '<input class="cell-input" placeholder="0" />', b('Awaiting Client Invoice')],
      [person('Grace Liu', 'W-2'), 'W-2', '168', '<button class="upload-mini">Upload</button>', '<input class="cell-input" placeholder="0" />', b('Awaiting Client Invoice')]
    ],
    'Northwind Labs': [
      [person('Jordan Blake', '1099'), '1099', '152', fileChip('NL-Oct26-Blake.pdf', '402 KB'), '<input class="cell-input" value="152" />', b('Approved')],
      [person('Maya Reed', 'W-2'), 'W-2', '168', fileChip('NL-Oct26-Maya.pdf', '405 KB'), '<input class="cell-input" value="168" />', b('Approved')],
      [person('Ava Chen', 'Contractor'), '1099', '160', '<button class="upload-mini">Upload</button>', '<input class="cell-input" placeholder="0" />', b('Awaiting Client Invoice')]
    ],
    'Meridian Retail Group': [
      [person('Priya Shah', 'Coral Staffing'), 'Consultant', '164', fileChip('MR-Oct26-Shah.pdf', '431 KB'), '<input class="cell-input" value="168" />', b('Rejected')],
      [person('Maya Reed', 'W-2'), 'W-2', '168', fileChip('MR-Oct26-Maya.pdf', '410 KB'), '<input class="cell-input" value="168" />', b('Approved')],
      [person('Natalie Brooks', 'Consultant'), 'Consultant', '152', '<button class="upload-mini">Upload</button>', '<input class="cell-input" placeholder="0" />', b('Awaiting Client Invoice')]
    ],
    'Lumen Logistics': [
      [person('Alex Morgan', 'W-2'), 'W-2', '160', fileChip('LL-Oct26-Morgan.pdf', '390 KB'), '<input class="cell-input" value="160" />', b('Approved')],
      [person('Ravi Menon', 'Consultant'), 'Consultant', '144', fileChip('LL-Oct26-Menon.pdf', '410 KB'), '<input class="cell-input" value="144" />', b('Approved')],
      [person('Alicia Ross', 'Account Manager'), 'W-2', '168', '<button class="upload-mini">Upload</button>', '<input class="cell-input" placeholder="0" />', b('Awaiting Client Invoice')]
    ]
  };

  return rowsByClient[clientName] || rowsByClient['Blue Harbor Health'];
}

const DASHBOARD_KPI_TARGETS = {
  superadmin: ['clients', 'vendors', 'teamMembers', 'teamMembers'],
  accountmanager: ['clients', 'vendorList', 'invoiceUpload', 'reconciliation'],
  vendor: ['consultants', 'invoices', 'rejectedInvoice', 'docs'],
  w2: ['engagements', 'status', 'status', 'docs'],
  w9: ['engagements', 'status', 'correction', 'docs']
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
    client: 'Northwind Labs', rate: '62.00', location: 'Remote', start: '2026-03-02', end: '2027-02-26',
    term: 'Net 15', status: 'Active', am: 'Alicia Ross',
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
    client: 'Northwind Labs', rate: '90.00', location: 'Remote', start: '2026-07-06', end: '2027-01-08',
    term: 'Net 15', status: 'Active', am: 'Alicia Ross',
    docs: [
      ['1099 contract — Northwind Labs', 'Blake_1099_Northwind.pdf', 'Jul 1, 2026', 'Jan 8, 2027', 'Signed'],
      ['W-9', 'Blake_W9_2026.pdf', 'Jun 30, 2026', '—', 'Valid'],
      ['ACH form', 'Blake_ACH.pdf', 'Jun 30, 2026', '—', 'Valid']
    ]
  },
  'Deepa Kumar': {
    type: 'Consultant', vendor: 'Coral Staffing LLC', vendorContact: 'Daniel Ortiz · d.ortiz@coralstaffing.com',
    role: 'Business Analyst', email: 'deepa.kumar@coralstaffing.com', phone: '(512) 555-0147',
    client: 'Blue Harbor Health', rate: '80.00', location: 'Hybrid', start: '2026-01-12', end: '2026-12-31',
    term: 'Net 30', status: 'Active', am: 'Alicia Ross',
    docs: [
      ['Resume', 'Deepa_Kumar_Resume.pdf', 'Jan 5, 2026', '—', 'Valid'],
      ['Work authorization (H-1B)', 'Kumar_H1B_Approval.pdf', 'Dec 1, 2025', 'Nov 30, 2026', 'Expiring Soon'],
      ['I-9 audit report', 'Kumar_I9_Audit.pdf', 'Jan 9, 2026', '—', 'Valid'],
      ['E-Verify document', 'Kumar_EVerify.pdf', 'Jan 9, 2026', '—', 'Valid']
    ]
  },
  'Rinaldo Silva': {
    type: 'Consultant', vendor: 'Coral Staffing LLC', vendorContact: 'Daniel Ortiz · d.ortiz@coralstaffing.com',
    role: 'QA Engineer', email: 'rinaldo.silva@coralstaffing.com', phone: '(512) 555-0163',
    client: 'Apex Systems', rate: '72.00', location: 'Remote', start: '2026-09-14', end: '2027-03-12',
    term: 'Net 30', status: 'Active', am: 'Benjamin Cole',
    docs: [
      ['Resume', 'Rinaldo_Silva_Resume.pdf', 'Sep 1, 2026', '—', 'Valid'],
      ['Work authorization (Green Card)', 'Silva_GC.pdf', 'Sep 1, 2026', 'Aug 14, 2033', 'Valid'],
      ['I-9 audit report', 'Silva_I9_Audit.pdf', 'Sep 10, 2026', '—', 'Valid'],
      ['E-Verify document', 'Silva_EVerify.pdf', 'Sep 10, 2026', '—', 'Valid']
    ]
  },
  'Kevin Singh': {
    type: 'Consultant', vendor: 'Summit IT Solutions', vendorContact: 'Ravi Menon · ravi@summitits.com',
    role: 'Java Developer', email: 'kevin.singh@summitits.com', phone: '(732) 555-0119',
    client: 'Blue Harbor Health', rate: '85.00', location: 'Hybrid', start: '2026-04-01', end: '2027-03-31',
    term: 'Net 30', status: 'Active', am: 'Alicia Ross',
    docs: [
      ['Resume', 'Kevin_Singh_Resume.pdf', 'Mar 20, 2026', '—', 'Valid'],
      ['Work authorization (EAD)', 'Singh_EAD.pdf', 'Mar 20, 2026', 'Jun 30, 2027', 'Valid'],
      ['I-9 audit report', 'Singh_I9_Audit.pdf', 'Mar 28, 2026', '—', 'Valid'],
      ['E-Verify document', 'Singh_EVerify.pdf', 'Mar 28, 2026', '—', 'Valid']
    ]
  },
  'Priya Shah': {
    type: 'Consultant', vendor: 'Coral Staffing LLC', vendorContact: 'Daniel Ortiz · d.ortiz@coralstaffing.com',
    role: 'Data Engineer', email: 'priya.shah@coralstaffing.com', phone: '(512) 555-0174',
    client: 'Meridian Retail Group', rate: '88.00', location: 'Remote', start: '2026-11-16', end: '2027-05-14',
    term: 'Net 30', status: 'Onboarding', am: 'Alicia Ross',
    docs: [
      ['Resume', 'Priya_Shah_Resume.pdf', 'Nov 9, 2026', '—', 'Valid'],
      ['Work authorization (H-1B)', 'Shah_H1B_Approval.pdf', 'Nov 9, 2026', 'Oct 1, 2028', 'Valid'],
      ['I-9 audit report', null, '—', '—', 'Incomplete'],
      ['E-Verify document', null, '—', '—', 'Incomplete']
    ]
  }
};

let selectedMember = 'Maya Reed';

function memberAction(name, withSubmissions) {
  return `<div class="row-actions"><button class="link-btn" data-target="memberDetail" data-member="${name}">View / Edit</button>${withSubmissions ? `<button class="link-btn" data-target="memberSubmissions" data-member="${name}">Invoices &amp; Timesheets</button>` : ''}</div>`;
}

/* ---------- Invoices & timesheets per person (Super Admin) ---------- */

// invoice / timesheet: file name, null = not uploaded (admin can upload), 'na' = not applicable (W-2 has no invoice)
const MEMBER_SUBMISSIONS = {
  'Maya Reed': [
    { period: 'Nov 2026', client: 'Northwind Labs', ref: '—', hours: '—', amount: '—', invoice: 'na', timesheet: null, status: 'Due' },
    { period: 'Oct 2026', client: 'Northwind Labs', ref: 'TS-2026-10-0093', hours: '168', amount: '—', invoice: 'na', timesheet: 'Reed_Oct26.pdf', status: 'Approved' },
    { period: 'Oct 2026', client: 'Meridian Retail Group', ref: 'TS-2026-10-0101', hours: '40', amount: '—', invoice: 'na', timesheet: 'Reed_Meridian_Oct26.pdf', status: 'Awaiting Client Invoice' },
    { period: 'Sep 2026', client: 'Northwind Labs', ref: 'TS-2026-09-0071', hours: '160', amount: '—', invoice: 'na', timesheet: 'Reed_Sep26_v2.pdf', status: 'Approved' }
  ],
  'Jordan Blake': [
    { period: 'Oct 2026', client: 'Northwind Labs', ref: 'INV-2026-10-0151', hours: '152', amount: '$13,680.00', invoice: 'BlakeUX-0046.pdf', timesheet: 'Blake_Northwind_Oct26.pdf', status: 'Awaiting Client Invoice' },
    { period: 'Oct 2026', client: 'Apex Systems', ref: 'INV-2026-10-0164', hours: '102', amount: '$8,364.00', invoice: 'BlakeUX-0045.pdf', timesheet: 'Blake_Apex_Oct26.pdf', status: 'Approved' },
    { period: 'Sep 2026', client: 'Apex Systems', ref: 'INV-2026-09-0388', hours: '108', amount: '$8,856.00', invoice: 'BlakeUX-0039.pdf', timesheet: 'Blake_Apex_Sep26.pdf', status: 'Rejected' },
    { period: 'Sep 2026', client: 'Northwind Labs', ref: 'INV-2026-09-0352', hours: '160', amount: '$14,400.00', invoice: 'BlakeUX-0038.pdf', timesheet: 'Blake_Northwind_Sep26.pdf', status: 'Approved' }
  ],
  'Deepa Kumar': [
    { period: 'Oct 2026', client: 'Blue Harbor Health', ref: 'INV-2026-10-0203', hours: '160', amount: '$12,800.00', invoice: 'CS-INV-10477.pdf', timesheet: 'Kumar_Oct26_timesheet.pdf', status: 'Rejected' },
    { period: 'Sep 2026', client: 'Blue Harbor Health', ref: 'INV-2026-09-0145', hours: '168', amount: '$13,440.00', invoice: 'CS-INV-10391.pdf', timesheet: 'Kumar_Sep26_timesheet.pdf', status: 'Approved' }
  ],
  'Rinaldo Silva': [
    { period: 'Oct 2026', client: 'Apex Systems', ref: 'INV-2026-10-0142', hours: '168', amount: '$12,096.00', invoice: 'CS-INV-10482.pdf', timesheet: 'Silva_Oct26_timesheet.pdf', status: 'Approved' },
    { period: 'Sep 2026', client: 'Apex Systems', ref: 'INV-2026-09-0133', hours: '96', amount: '$6,912.00', invoice: 'CS-INV-10388.pdf', timesheet: null, status: 'In Progress' }
  ],
  'Kevin Singh': [
    { period: 'Oct 2026', client: 'Blue Harbor Health', ref: 'INV-2026-10-0187', hours: '160', amount: '$13,600.00', invoice: 'SIT-INV-2210.pdf', timesheet: 'Singh_Oct26_timesheet.pdf', status: 'Rejected' },
    { period: 'Sep 2026', client: 'Blue Harbor Health', ref: 'INV-2026-09-0129', hours: '168', amount: '$14,280.00', invoice: null, timesheet: 'Singh_Sep26_timesheet.pdf', status: 'In Progress' }
  ],
  'Priya Shah': [
    { period: 'Nov 2026', client: 'Meridian Retail Group', ref: '—', hours: '—', amount: '—', invoice: null, timesheet: null, status: 'Not Started' }
  ]
};

function submissionDocCell(file, kind) {
  if (file === 'na') return '<span class="person-sub inline">Not applicable</span>';
  if (file) return `<div class="doc-cell">${fileChip(file)}<button class="link-btn">View</button></div>`;
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
      { label: m.type === 'W-2' ? 'Submit Timesheet' : 'Submit Invoice', target: 'submitOnBehalf', primary: true }
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
    title: w2 ? `Submit Timesheet for ${name}` : `Submit Invoice for ${name}`,
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
            { label: 'Engagement', type: 'select', options: [`${m.client} — ${m.role}`], required: true },
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

// Each client has exactly one account manager (PRD CL-8). null = not assigned yet.
const CLIENT_AM = {
  'Northwind Labs': 'Alicia Ross',
  'Blue Harbor Health': 'Alicia Ross',
  'Meridian Retail Group': 'Alicia Ross',
  'Lumen Logistics': 'Alicia Ross',
  'Apex Systems': 'Benjamin Cole',
  'Helix Biotech': 'Benjamin Cole',
  'GlobalCare Insurance': 'Priya Natarajan',
  'Lakeshore Financial': null
};

function clientOptions(forAm) {
  return Object.entries(CLIENT_AM).map(([client, am]) => ({
    value: client,
    hint: !am ? 'Unassigned' : am === forAm ? 'Assigned' : `Currently ${am}`
  }));
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
          hint: 'Select one or more clients. A client has one account manager, so picking an assigned client moves it to this account manager.',
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
          hint: 'Add clients here. To take a client away, assign it to another account manager instead, so it is never left without one.',
          fields: [
            {
              label: 'Clients', type: 'multiselect', full: true, required: true, placeholder: 'Select clients…',
              options: clientOptions(am.name),
              selected: Object.keys(CLIENT_AM).filter((c) => CLIENT_AM[c] === am.name)
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
  'INV-2026-10-0151': { client: 'Northwind Labs', period: 'October 2026', hours: '152', rate: '$90.00', amount: '$13,680.00', term: 'Net 15', submitted: 'Nov 2, 2026', status: 'Awaiting Client Invoice', invoice: ['BlakeUX-0046.pdf', '148 KB'], timesheet: ['Blake_Northwind_Oct26.pdf', '92 KB'] },
  'INV-2026-10-0164': { client: 'Apex Systems', period: 'October 2026', hours: '102', rate: '$82.00', amount: '$8,364.00', term: 'Net 30', submitted: 'Nov 3, 2026', status: 'Approved', invoice: ['BlakeUX-0045.pdf', '151 KB'], timesheet: ['Blake_Apex_Oct26.pdf', '88 KB'] },
  'INV-2026-09-0388': { client: 'Apex Systems', period: 'September 2026', hours: '108', rate: '$82.00', amount: '$8,856.00', term: 'Net 30', submitted: 'Oct 4, 2026', status: 'Rejected', reason: 'Billing period did not match the client invoice.', invoice: ['BlakeUX-0039.pdf', '146 KB'], timesheet: ['Blake_Apex_Sep26.pdf', '90 KB'] },
  'INV-2026-09-0352': { client: 'Northwind Labs', period: 'September 2026', hours: '160', rate: '$90.00', amount: '$14,400.00', term: 'Net 15', submitted: 'Oct 2, 2026', status: 'Approved', invoice: ['BlakeUX-0038.pdf', '150 KB'], timesheet: ['Blake_Northwind_Sep26.pdf', '94 KB'] }
};

let selectedInvoice = 'INV-2026-10-0151';

function invoiceViewAction(id) {
  return `<button class="link-btn" data-target="invoiceView" data-invoice="${id}">View</button>`;
}

function invoiceViewScreen(screen, id) {
  const inv = RESOURCE_INVOICES[id] || RESOURCE_INVOICES['INV-2026-10-0151'];
  const docRow = (label, [file, size]) => [label, fileChip(file, size), inv.submitted, '<div class="row-actions"><button class="link-btn">View</button><button class="link-btn">Download</button></div>'];
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
  'msa-northwind': { name: 'MSA', owner: 'Northwind Labs', type: 'Client', status: 'Valid', versions: [
    ['v1', 'Northwind_MSA_2021.pdf', 'Feb 12, 2021', 'Arun Krishnan', 'Feb 11, 2023'],
    ['v2', 'Northwind_MSA_2023.pdf', 'Feb 10, 2023', 'Alicia Ross', 'Feb 11, 2025'],
    ['v3', 'Northwind_MSA_2025.pdf', 'Feb 7, 2025', 'Alicia Ross', 'Feb 12, 2027']] },
  'coi-coral': { name: 'COI', owner: 'Coral Staffing LLC', type: 'Vendor', status: 'Expiring Soon', versions: [
    ['v1', 'Coral_COI_2024.pdf', 'Nov 20, 2024', 'Daniel Ortiz', 'Nov 25, 2025'],
    ['v2', 'Coral_COI_2025.pdf', 'Nov 18, 2025', 'Daniel Ortiz', 'Nov 25, 2026']] },
  'wa-kumar': { name: 'Work authorization (H-1B)', owner: 'Deepa Kumar', type: 'Consultant', status: 'Expiring Soon', versions: [
    ['v1', 'Kumar_H1B_Approval.pdf', 'Dec 1, 2025', 'Daniel Ortiz', 'Nov 30, 2026']] },
  'msa-helix': { name: 'MSA', owner: 'Helix Biotech', type: 'Client', status: 'Expired', versions: [
    ['v1', 'Helix_MSA_2024.pdf', 'Oct 30, 2024', 'Benjamin Cole', 'Oct 31, 2026']] },
  'i9-reed': { name: 'I-9', owner: 'Maya Reed', type: 'W-2 Resource', status: 'Incomplete', versions: [] },
  'everify-torres': { name: 'E-Verify', owner: 'Ana Torres', type: 'Consultant', status: 'Not Applicable', versions: [] },
  'msa-blueharbor': { name: 'MSA', owner: 'Blue Harbor Health', type: 'Client', status: 'Expiring Soon', versions: [
    ['v1', 'BlueHarbor_MSA_2022.pdf', 'Dec 5, 2022', 'Arun Krishnan', 'Dec 09, 2024'],
    ['v2', 'BlueHarbor_MSA_2024.pdf', 'Dec 4, 2024', 'Alicia Ross', 'Dec 09, 2026']] },
  'ach-ridgeline': { name: 'ACH form', owner: 'Ridgeline Talent Group', type: 'Vendor', status: 'Incomplete', versions: [] },
  'w9-summit': { name: 'W-9', owner: 'Summit IT Solutions', type: 'Vendor', status: 'Valid', versions: [
    ['v1', 'Summit_W9_2025.pdf', 'Jul 1, 2025', 'Ravi Menon', 'Jul 01, 2026'],
    ['v2', 'Summit_W9_2026.pdf', 'Jun 28, 2026', 'Ravi Menon', 'Jul 01, 2027']] }
};

const TRACKER_DOC_IDS = {
  superadmin: ['msa-northwind', 'coi-coral', 'wa-kumar', 'msa-helix', 'i9-reed', 'everify-torres'],
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
              '<div class="row-actions"><button class="link-btn">View</button><button class="link-btn">Download</button></div>'
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
  'INV-2026-10-0142': { person: 'Rinaldo Silva', sub: 'Coral Staffing', vendor: 'Coral Staffing LLC', client: 'Apex Systems', period: 'October 2026', hours: 168, clientHours: 168, rate: 72, term: 'Net 30', submitted: 'Nov 4 (v2)', status: 'Approved', invoice: 'CS-INV-10482.pdf', timesheet: 'Silva_Oct26_timesheet.pdf' },
  'INV-2026-10-0151': { person: 'Jordan Blake', sub: '1099', client: 'Northwind Labs', period: 'October 2026', hours: 152, clientHours: null, rate: 90, term: 'Net 15', submitted: 'Nov 2', status: 'In Progress', invoice: 'BlakeUX-0046.pdf', timesheet: 'Blake_Northwind_Oct26.pdf' },
  'INV-2026-10-0187': { person: 'Kevin Singh', sub: 'Summit IT', vendor: 'Summit IT Solutions', client: 'Blue Harbor Health', period: 'October 2026', hours: 160, clientHours: 152, rate: 85, term: 'Net 30', submitted: 'Nov 3', status: 'Rejected', invoice: 'SIT-INV-2210.pdf', timesheet: 'Singh_Oct26_timesheet.pdf' },
  'TS-2026-10-0093': { person: 'Maya Reed', sub: 'W-2 · timesheet', w2: true, client: 'Northwind Labs', period: 'October 2026', hours: 168, clientHours: 168, rate: 62, term: 'Net 15', submitted: 'Nov 2', status: 'Approved', invoice: 'na', timesheet: 'Reed_Oct26.pdf' },
  'INV-2026-10-0203': { person: 'Deepa Kumar', sub: 'Coral Staffing', vendor: 'Coral Staffing LLC', client: 'Blue Harbor Health', period: 'October 2026', hours: 160, clientHours: 168, rate: 80, term: 'Net 30', submitted: 'Nov 3', status: 'Rejected', invoice: 'CS-INV-10477.pdf', timesheet: 'Kumar_Oct26_timesheet.pdf' },
  'INV-2026-10-0211': { person: 'Ana Torres', sub: 'BluePeak Consulting', vendor: 'BluePeak Consulting Inc.', client: 'GlobalCare Insurance', period: 'October 2026', hours: 176, clientHours: 176, rate: 88, term: 'Net 30', submitted: 'Nov 4', status: 'Approved', invoice: 'BP-INV-5521.pdf', timesheet: 'Torres_Oct26_timesheet.pdf' },
  'INV-2026-10-0198': { person: 'Omar Haddad', sub: 'Coral Staffing', vendor: 'Coral Staffing LLC', client: 'Blue Harbor Health', period: 'October 2026', hours: 144, clientHours: null, rate: 84, term: 'Net 30', submitted: 'Nov 3', status: 'In Progress', invoice: 'CS-INV-10479.pdf', timesheet: null },
  'INV-2026-10-0176': { person: 'Sofia Marin', sub: 'Coral Staffing', vendor: 'Coral Staffing LLC', client: 'Meridian Retail Group', period: 'October 2026', hours: 168, clientHours: null, rate: 76, term: 'Net 30', submitted: 'Nov 2', status: 'In Progress', invoice: 'CS-INV-10471.pdf', timesheet: 'Marin_Oct26_timesheet.pdf' },
  'NS-ELENA': { person: 'Elena Petrova', sub: 'Coral Staffing', vendor: 'Coral Staffing LLC', client: 'Apex Systems', period: 'October 2026', hours: null, clientHours: 160, rate: 78, term: 'Net 30', submitted: '—', status: 'Not Submitted', invoice: null, timesheet: null },
  'NS-LENA': { person: 'Lena Fischer', sub: 'Summit IT', vendor: 'Summit IT Solutions', client: 'Blue Harbor Health', period: 'October 2026', hours: null, clientHours: 168, rate: 82, term: 'Net 30', submitted: '—', status: 'Not Submitted', invoice: null, timesheet: null },
  'NS-AVA': { person: 'Ava Chen', sub: '1099', client: 'Northwind Labs', period: 'October 2026', hours: null, clientHours: 160, rate: 86, term: 'Net 15', submitted: '—', status: 'Not Submitted', invoice: null, timesheet: null }
};

const AUDIT_INVOICE_IDS = ['INV-2026-10-0142', 'INV-2026-10-0151', 'INV-2026-10-0187', 'TS-2026-10-0093', 'INV-2026-10-0203', 'INV-2026-10-0211', 'NS-LENA', 'NS-AVA'];
const VENDOR_INVOICE_IDS = ['INV-2026-10-0203', 'INV-2026-10-0142', 'INV-2026-10-0198', 'INV-2026-10-0176', 'NS-ELENA'];

let selectedInv = 'INV-2026-10-0142';
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
    return canManageInvoices() ? `<div class="row-actions">${link('Upload', 'invoiceUpdate')}</div>` : '<span class="person-sub inline">Due Nov 15</span>';
  }
  const parts = [link('View', 'invoiceDetail')];
  if (inv.status === 'Rejected' && canManageInvoices()) parts.push(link('Upload corrected', 'invoiceUpdate'));
  else if (activePersona === 'superadmin') parts.push(link('Edit', 'invoiceUpdate'));
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

function auditInvoicesTable(table) {
  return {
    ...table,
    rows: AUDIT_INVOICE_IDS.map((id) => {
      const inv = INVOICES[id];
      return [mono(invRef(id)), person(inv.person, inv.sub), inv.client, inv.period.replace('October', 'Oct'), invHours(inv), invAmount(inv), b(inv.status), invoiceActions(id)];
    })
  };
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
  const inv = INVOICES[id] || INVOICES['INV-2026-10-0142'];
  const manage = canManageInvoices();
  const actions = [];
  if (inv.status === 'Rejected') {
    actions.push(manage ? { label: 'Upload Corrected Invoice', target: 'invoiceUpdate', primary: true } : { label: 'Correct Invoice', target: 'rejectedInvoice', primary: true });
  } else if (inv.status === 'Not Submitted' && manage) {
    actions.push({ label: inv.w2 ? 'Upload Timesheet' : 'Upload Invoice & Timesheet', target: 'invoiceUpdate', primary: true });
  } else if (activePersona === 'superadmin') {
    actions.push({ label: 'Edit', target: 'invoiceUpdate', primary: true });
  }
  const fileRow = (label, kind) => {
    const file = inv[kind];
    return [label, invoiceFileCell(id, kind), file && file !== 'na' ? inv.submitted : '—',
      file && file !== 'na' ? '<div class="row-actions"><button class="link-btn">View</button><button class="link-btn">Download</button></div>' : ''];
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
        ? { tone: 'warning', title: 'Not submitted yet', text: `No invoice or timesheet for ${inv.period}. Due Nov 15.${manage ? ' You can upload them on their behalf.' : ''}` }
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
            { label: 'Client', value: inv.client, readonly: true, lock: 'Engagement' },
            { label: 'Billing period', value: inv.period, readonly: true, lock: 'Engagement' },
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
    { label: 'Client', value: m.client },
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
    description: `${typeLabel(m)} · ${m.role} at ${m.client}. Full profile and documents on file.`,
    detail: {
      sections: [
        { title: 'Personal details', items: personal },
        { title: 'Engagement', items: engagement }
      ],
      documents: {
        title: 'Documents',
        hint: missing ? `${missing} document${missing > 1 ? 's' : ''} missing — shown as Incomplete in the Document Tracker.` : 'All onboarding documents on file.',
        headers: ['Document', 'File', 'Last Updated', 'Expires', 'Status', 'Actions'],
        rows: m.docs.map(([doc, file, updated, expires, status]) => [
          doc,
          file ? fileChip(file) : '<span class="person-sub inline">Not uploaded</span>',
          updated,
          expires,
          b(status),
          file ? '<div class="row-actions"><button class="link-btn">View</button><button class="link-btn">Download</button></div>' : '<button class="link-btn">Request</button>'
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
  const engagement = [
    { label: 'Client', type: 'select', options: withCurrent(m.client, ['Northwind Labs', 'Blue Harbor Health', 'Apex Systems', 'Meridian Retail Group', 'Lumen Logistics']), required: true },
    { label: 'Role', value: m.role, required: true },
    { label: 'Hourly rate (USD)', value: m.rate, required: true },
    { label: 'Work location', type: 'select', options: withCurrent(m.location, ['Remote', 'Hybrid', 'Onsite']) },
    { label: 'Start date', type: 'date', value: m.start },
    { label: 'End date', type: 'date', value: m.end },
    { label: 'Payment term', type: 'select', options: withCurrent(m.term, ['Net 15', 'Net 7', 'Net 30', 'Net 45', 'Net 60', 'Immediate', 'Custom']), customInput: true },
    activePersona === 'superadmin'
      ? { label: 'Account manager', type: 'select', options: withCurrent(m.am, ['Alicia Ross', 'Benjamin Cole', 'Priya Natarajan']) }
      : { label: 'Account manager', value: m.am, readonly: true, lock: 'Assigned by Super Admin' },
    { label: 'Status', type: 'select', options: withCurrent(m.status, ['Active', 'Onboarding', 'Inactive', 'Ended']) }
  ];
  const documents = m.docs.map(([doc, file, , expires]) => ({
    label: expires !== '—' ? `${doc} (expires ${expires})` : doc,
    type: 'upload',
    file: file || undefined
  }));
  return {
    ...screen,
    title: `Edit ${name}`,
    description: 'Update personal details, engagement and documents. Every change is recorded in the Audit Log.',
    form: {
      sections: [
        { title: 'Personal details', fields: personal },
        { title: 'Engagement', fields: engagement },
        { title: 'Documents', hint: 'PDF, DOCX, JPG or PNG · max 5 MB each. Replacing a file keeps the previous version.', fields: documents }
      ],
      submit: { label: 'Save Changes', target: 'memberDetail' },
      cancel: { label: 'Cancel', target: 'memberDetail' }
    }
  };
}

const MEMBER_SCREENS = [
  {
    id: 'memberDetail',
    parent: 'teamMembers',
    title: 'Team Member',
    actions: [{ label: 'Edit', target: 'memberEdit', primary: true }]
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
      { label: 'Invoices', target: 'invoiceAudit' },
      { label: 'Document Tracker', target: 'documentTracker' },
      { label: 'Audit Log', target: 'audit' },
      { label: 'Admin User Management', target: 'adminUsers' }
    ],
    screens: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Platform-wide view of clients, vendors, people and the October 2026 billing cycle.',
        kpis: [
          { label: 'Active clients', value: '128', trend: '+4 this quarter', tone: 'up' },
          { label: 'Active vendors', value: '84', trend: '+3 this quarter', tone: 'up' },
          { label: 'Vendor consultants', value: '492', trend: '+27 this quarter', tone: 'up' },
          { label: 'W-2 / 1099 resources', value: '215', trend: '142 W-2 · 73 1099', tone: 'neutral' }
        ],
        panels: [
          {
            title: 'Invoices by status — Oct 2026',
            chip: '707 total',
            bars: [
              { label: 'Approved', value: 512, pct: 72, tone: 'approved', target: 'invoiceAudit', tab: 1 },
              { label: 'In Progress (awaiting client invoice)', value: 141, pct: 20, tone: 'progress', target: 'invoiceAudit', tab: 2 },
              { label: 'Rejected', value: 38, pct: 5, tone: 'rejected', target: 'invoiceAudit', tab: 3 },
              { label: 'Not yet submitted', value: 16, pct: 3, tone: 'neutral', target: 'invoiceAudit', tab: 4 }
            ]
          },
          {
            title: 'Expiring in the next 30 days',
            chip: '20 documents',
            items: [
              { label: sub('COI — Coral Staffing LLC', 'Vendor document'), value: b('Expiring Soon'), meta: 'Nov 25' },
              { label: sub('Work authorization — Deepa Kumar', 'Consultant · Coral Staffing'), value: b('Expiring Soon'), meta: 'Nov 30' },
              { label: sub('MSA — Blue Harbor Health', 'Client document'), value: b('Expiring Soon'), meta: 'Dec 09' },
              { label: sub('PO — Summit IT Solutions', 'Vendor document'), value: b('Expiring Soon'), meta: 'Dec 04' }
            ]
          }
        ],
        activity: [
          { who: 'Alicia Ross', what: 'uploaded Oct 2026 client invoices for <b>Blue Harbor Health</b> (2 of 5 people)', when: '12 min ago' },
          { who: 'System', what: 'auto-rejected <b>INV-2026-10-0187</b> (Kevin Singh) — hours mismatch', when: '12 min ago' },
          { who: 'Daniel Ortiz', what: 'added consultant <b>Priya Shah</b> to Coral Staffing LLC', when: '39 min ago' },
          { who: 'Benjamin Cole', what: 'onboarded vendor <b>Keystone Tech Partners</b>', when: '2 hrs ago' },
          { who: 'Arun Krishnan', what: 'renewed MSA for <b>Apex Systems</b> through Jan 30, 2028', when: 'Yesterday' }
        ]
      },
      {
        id: 'clients',
        title: 'Client Management',
        description: 'Every client, its assigned account manager, and MSA coverage.',
        actions: [{ label: 'Add Client', target: 'clientAdd', primary: true }],
        table: {
          title: 'All clients',
          total: 128,
          headers: ['Client', 'Region', 'Account Manager', 'MSA Expiry', 'Client invoice status', 'Actions'],
          rows: [
            [sub('Northwind Labs', 'USD · America/New_York'), 'US-East', 'Alicia Ross', 'Feb 12, 2027', b('Uploaded'), `<div class="row-actions"><button class="link-btn" data-target="clientEdit">View / Edit</button><button class="link-btn" data-target="clientHolidayCalendar">Holiday Calendar</button>${clientInvoiceAction('Northwind Labs')}</div>`],
            [sub('Apex Systems', 'USD · America/Los_Angeles'), 'US-West', 'Benjamin Cole', 'Jan 30, 2028', b('Uploaded'), `<div class="row-actions"><button class="link-btn" data-target="clientEdit">View / Edit</button><button class="link-btn" data-target="clientHolidayCalendar">Holiday Calendar</button>${clientInvoiceAction('Apex Systems')}</div>`],
            [sub('Blue Harbor Health', 'USD · America/Chicago'), 'Central', 'Alicia Ross', `Dec 09, 2026 ${b('Expiring Soon')}`, `${b('In Progress')} <span class="person-sub inline">2 of 5</span>`, `<div class="row-actions"><button class="link-btn" data-target="clientEdit">View / Edit</button><button class="link-btn" data-target="clientHolidayCalendar">Holiday Calendar</button>${clientInvoiceAction('Blue Harbor Health')}</div>`],
            [sub('GlobalCare Insurance', 'USD · America/New_York'), 'US-East', 'Priya Natarajan', 'Jun 30, 2027', b('Pending'), `<div class="row-actions"><button class="link-btn" data-target="clientEdit">View / Edit</button><button class="link-btn" data-target="clientHolidayCalendar">Holiday Calendar</button>${clientInvoiceAction('GlobalCare Insurance')}</div>`],
            [sub('Meridian Retail Group', 'CAD · America/Toronto'), 'Canada', 'Alicia Ross', 'Mar 31, 2027', b('Pending'), `<div class="row-actions"><button class="link-btn" data-target="clientEdit">View / Edit</button><button class="link-btn" data-target="clientHolidayCalendar">Holiday Calendar</button>${clientInvoiceAction('Meridian Retail Group')}</div>`],
            [sub('Helix Biotech', 'USD · America/Denver'), 'Mountain', 'Benjamin Cole', `Oct 31, 2026 ${b('Expired')}`, b('Missing'), `<div class="row-actions"><button class="link-btn" data-target="clientEdit">View / Edit</button><button class="link-btn" data-target="clientHolidayCalendar">Holiday Calendar</button>${clientInvoiceAction('Helix Biotech')}</div>`]
          ]
        }
      },
      {
        id: 'clientAdd',
        parent: 'clients',
        title: 'Add Client',
        description: 'Create a client, assign its account manager and upload the MSA.',
        form: {
          sections: [
            {
              title: 'Client details',
              fields: [
                { label: 'Client name', value: 'Lakeshore Financial', required: true },
                { label: 'Billing email', value: 'ap@lakeshorefinancial.com', required: true },
                { label: 'Address', value: '200 N LaSalle St, Suite 1400, Chicago, IL 60601', full: true },
                { label: 'Currency', type: 'select', options: ['USD — US Dollar', 'CAD — Canadian Dollar'] },
                { label: 'Time zone', type: 'select', options: ['America/Chicago (CST)', 'America/New_York (EST)', 'America/Los_Angeles (PST)'] },
                { label: 'Account manager', type: 'select', options: ['Alicia Ross', 'Benjamin Cole', 'Priya Natarajan'], required: true }
              ]
            },
            {
              title: 'Holiday calendar',
              hint: 'Select up to 10 holidays. 7 of 10 selected.',
              fields: [
                { type: 'chips', full: true, options: ['Jan 1 · New Year’s Day', 'May 25 · Memorial Day', 'Jul 3 · Independence Day (obs.)', 'Sep 7 · Labor Day', 'Nov 26 · Thanksgiving', 'Nov 27 · Day after Thanksgiving', 'Dec 25 · Christmas Day'] }
              ]
            },
            {
              title: 'Master Services Agreement',
              fields: [
                { label: 'MSA start date', type: 'date', value: '2026-12-01', required: true },
                { label: 'MSA end date', type: 'date', value: '2028-11-30', required: true },
                { label: 'MSA document', type: 'upload', full: true, file: 'Lakeshore_MSA_signed.pdf', size: '1.8 MB' }
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
        description: 'Review and update the client profile, account assignment and holiday schedule.',
        form: {
          sections: [
            {
              title: 'Client details',
              fields: [
                { label: 'Client name', value: 'Lakeshore Financial', required: true },
                { label: 'Billing email', value: 'ap@lakeshorefinancial.com', required: true },
                { label: 'Address', value: '200 N LaSalle St, Suite 1400, Chicago, IL 60601', full: true },
                { label: 'Currency', type: 'select', options: ['USD — US Dollar', 'CAD — Canadian Dollar'] },
                { label: 'Time zone', type: 'select', options: ['America/Chicago (CST)', 'America/New_York (EST)', 'America/Los_Angeles (PST)'] },
                { label: 'Account manager', type: 'select', options: ['Alicia Ross', 'Benjamin Cole', 'Priya Natarajan'], required: true }
              ]
            },
            {
              title: 'Holiday calendar',
              hint: 'Select up to 10 holidays. 7 of 10 selected.',
              fields: [
                { type: 'chips', full: true, options: ['Jan 1 · New Year’s Day', 'May 25 · Memorial Day', 'Jul 3 · Independence Day (obs.)', 'Sep 7 · Labor Day', 'Nov 26 · Thanksgiving', 'Nov 27 · Day after Thanksgiving', 'Dec 25 · Christmas Day'] }
              ]
            },
            {
              title: 'Master Services Agreement',
              fields: [
                { label: 'MSA start date', type: 'date', value: '2026-12-01', required: true },
                { label: 'MSA end date', type: 'date', value: '2028-11-30', required: true },
                { label: 'MSA document', type: 'upload', full: true, file: 'Lakeshore_MSA_signed.pdf', size: '1.8 MB' }
              ]
            }
          ],
          submit: { label: 'Save Client', target: 'clients' },
          cancel: { label: 'Cancel', target: 'clients' },
          delete: { label: 'Delete Client', target: 'clients' }
        }
      },
      {
        id: 'clientHolidayCalendar',
        parent: 'clients',
        title: 'Holiday Calendar',
        description: 'Holidays mapped for Lakeshore Financial. These are used to calculate project working days and client-specific availability.',
        table: {
          title: 'Lakeshore Financial · Holiday list',
          total: 7,
          headers: ['Holiday', 'Date', 'Type', 'Status'],
          rows: [
            ['New Year’s Day', 'Jan 1, 2027', 'Observed holiday', b('Active')],
            ['Memorial Day', 'May 25, 2027', 'Federal holiday', b('Active')],
            ['Independence Day', 'Jul 3, 2027', 'Observed holiday', b('Active')],
            ['Labor Day', 'Sep 7, 2027', 'Federal holiday', b('Active')],
            ['Thanksgiving', 'Nov 26, 2027', 'Client holiday', b('Active')],
            ['Day after Thanksgiving', 'Nov 27, 2027', 'Client holiday', b('Active')],
            ['Christmas Day', 'Dec 25, 2027', 'Federal holiday', b('Active')]
          ]
        }
      },
      {
        id: 'invoiceUpload',
        title: 'Invoice Management',
        description: 'Upload each client’s monthly invoice and billable hours per person. Saving triggers reconciliation automatically.',
        filters: [
          { label: 'Client', options: ['Blue Harbor Health', 'Northwind Labs', 'Meridian Retail Group', 'Lumen Logistics'] },
          { label: 'Billing period', options: ['October 2026', 'September 2026', 'August 2026'] }
        ],
        table: {
          title: 'Blue Harbor Health · October 2026',
          chip: '5 people · 3 awaiting client invoice',
          noSearch: true,
          headers: ['Person', 'Type', 'Submitted Hours', 'Client Invoice', 'Client Billable Hours', 'Submission'],
          rows: [
            [person('Deepa Kumar', 'Coral Staffing'), 'Consultant', '160', fileChip('BH-Oct26-Kumar.pdf', '420 KB'), '<input class="cell-input" value="168" />', b('Rejected')],
            [person('Kevin Singh', 'Summit IT'), 'Consultant', '160', fileChip('BH-Oct26-Singh.pdf', '418 KB'), '<input class="cell-input" value="152" />', b('Rejected')],
            [person('Lena Fischer', 'Summit IT'), 'Consultant', '168', '<button class="upload-mini">Upload</button>', '<input class="cell-input" placeholder="0" />', b('Awaiting Client Invoice')],
            [person('Omar Haddad', 'Coral Staffing'), 'Consultant', '144', '<button class="upload-mini">Upload</button>', '<input class="cell-input" placeholder="0" />', b('Awaiting Client Invoice')],
            [person('Grace Liu', 'W-2'), 'W-2', '168', '<button class="upload-mini">Upload</button>', '<input class="cell-input" placeholder="0" />', b('Awaiting Client Invoice')]
          ]
        },
        footerActions: [
          { label: 'Save & Reconcile', target: 'reconciliation', primary: true },
          { label: 'Save Draft', target: 'invoiceUpload' }
        ]
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
            [sub('Coral Staffing LLC', 'Austin, TX'), 'Alicia Ross', '12', b('Active'), `<div class="row-actions"><button class="link-btn" data-target="vendorEdit">View / Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`],
            [sub('Ridgeline Talent Group', 'Charlotte, NC'), 'Benjamin Cole', '4', b('Onboarding'), `<div class="row-actions"><button class="link-btn" data-target="vendorEdit">View / Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`],
            [sub('BluePeak Consulting Inc.', 'Denver, CO'), 'Benjamin Cole', '8', b('Active'), `<div class="row-actions"><button class="link-btn" data-target="vendorEdit">View / Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`],
            [sub('Summit IT Solutions', 'Edison, NJ'), 'Alicia Ross', '19', b('Active'), `<div class="row-actions"><button class="link-btn" data-target="vendorEdit">View / Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`],
            [sub('Keystone Tech Partners', 'Pittsburgh, PA'), 'Priya Natarajan', '0', b('Invited'), `<div class="row-actions"><button class="link-btn" data-target="vendorEdit">View / Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`],
            [sub('Orbit Systems Group', 'San Jose, CA'), 'Priya Natarajan', '6', b('Inactive'), `<div class="row-actions"><button class="link-btn" data-target="vendorEdit">View / Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`]
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
                { label: 'Account manager', type: 'select', options: ['Alicia Ross', 'Benjamin Cole', 'Priya Natarajan'], required: true }
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
            [mono('INV-2026-10-0203'), person('Deepa Kumar'), 'Blue Harbor Health', '160', '$12,800.00', 'Nov 3', b('Rejected'), '<div class="row-actions"><button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0203">View</button><button class="link-btn" data-target="rejectedInvoice">Correct</button></div>'],
            [mono('INV-2026-10-0142'), person('Rinaldo Silva'), 'Apex Systems', '168', '$12,096.00', 'Nov 4 (v2)', b('Approved'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0142">View</button>'],
            [mono('INV-2026-10-0198'), person('Omar Haddad'), 'Blue Harbor Health', '144', '$12,096.00', 'Nov 3', b('In Progress'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0198">View</button>'],
            [mono('INV-2026-10-0176'), person('Sofia Marin'), 'Meridian Retail Group', '168', '$12,768.00', 'Nov 2', b('In Progress'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0176">View</button>']
          ]
        }
      },
      {
        id: 'vendorConsultants',
        parent: 'vendors',
        title: 'Vendor Consultants',
        description: 'Consultants associated with the selected vendor and their current client engagements.',
        table: {
          title: 'Coral Staffing consultants',
          total: 12,
          headers: ['Consultant', 'Client', 'Hourly Rate', 'Engagement', 'Location', 'Status', 'Actions'],
          rows: [
            [person('Deepa Kumar', 'Business Analyst'), 'Blue Harbor Health', '$80.00', 'Jan 12 – Dec 31, 2026', 'Hybrid', b('Active'), acts('View', 'Edit')],
            [person('Rinaldo Silva', 'QA Engineer'), 'Apex Systems', '$72.00', 'Sep 14, 2026 – Mar 12, 2027', 'Remote', b('Active'), acts('View', 'Edit')],
            [person('Omar Haddad', 'DevOps Engineer'), 'Blue Harbor Health', '$84.00', 'Feb 2, 2026 – Jan 29, 2027', 'Onsite', b('Active'), acts('View', 'Edit')],
            [person('Sofia Marin', 'Scrum Master'), 'Meridian Retail Group', '$76.00', 'May 4, 2026 – Nov 27, 2026', 'Remote', b('Active'), acts('View', 'Edit')],
            [person('Priya Shah', 'Data Engineer'), 'Meridian Retail Group', '$88.00', 'Nov 16, 2026 – May 14, 2027', 'Remote', b('Onboarding'), acts('View', 'Edit')]
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
              title: 'Company',
              fields: [
                { label: 'Vendor name', value: 'Harborview Staffing LLC', required: true },
                { label: 'Federal ID (EIN)', value: '47-2810356', required: true },
                { label: 'Email', value: 'contracts@harborviewstaffing.com', required: true },
                { label: 'Phone', value: '(617) 555-0142' },
                { label: 'Address', value: '75 State St, Floor 9, Boston, MA 02109', full: true },
                { label: 'State of incorporation', type: 'select', options: ['Massachusetts', 'Delaware', 'New York'] },
                { label: 'Account manager', type: 'select', options: ['Alicia Ross', 'Benjamin Cole', 'Priya Natarajan'], required: true }
              ]
            },
            {
              title: 'Authorized signatory',
              fields: [
                { label: 'Name', value: 'Rachel Moreno' },
                { label: 'Phone', value: '(617) 555-0198' }
              ]
            },
            {
              title: 'Onboarding documents',
              hint: 'Documents not uploaded now are marked Incomplete in the Document Tracker.',
              fields: [
                { label: 'MSA (Nov 15, 2026 – Nov 14, 2028)', type: 'upload', file: 'Harborview_MSA.pdf', size: '2.1 MB' },
                { label: 'PO (Nov 15, 2026 – May 14, 2027)', type: 'upload', file: 'PO-44120.pdf', size: '340 KB' },
                { label: 'W-9', type: 'upload', file: 'Harborview_W9_2026.pdf', size: '210 KB' },
                { label: 'COI', type: 'upload' },
                { label: 'ACH form', type: 'upload' }
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
        description: 'Vendor consultants plus in-house W-2 and 1099 resources, per client engagement.',
        actions: [{ label: 'Add Resource', target: 'resourceAdd', primary: true }],
        table: {
          title: 'All team members',
          total: 707,
          headers: ['Name', 'Type', 'Client', 'Hourly Rate', 'Engagement', 'Status', 'Actions'],
          rows: [
            [person('Maya Reed', 'Data Analyst'), 'W-2', 'Northwind Labs', '$62.00', 'Mar 2, 2026 – Feb 26, 2027', b('Active'), memberAction('Maya Reed', true)],
            [person('Jordan Blake', 'UX Consultant'), '1099', 'Northwind Labs', '$90.00', 'Jul 6, 2026 – Jan 8, 2027', b('Active'), memberAction('Jordan Blake', true)],
            [person('Deepa Kumar', 'Business Analyst · Coral Staffing'), 'Consultant', 'Blue Harbor Health', '$80.00', 'Jan 12, 2026 – Dec 31, 2026', b('Active'), memberAction('Deepa Kumar', true)],
            [person('Rinaldo Silva', 'QA Engineer · Coral Staffing'), 'Consultant', 'Apex Systems', '$72.00', 'Sep 14, 2026 – Mar 12, 2027', b('Active'), memberAction('Rinaldo Silva', true)],
            [person('Kevin Singh', 'Java Developer · Summit IT'), 'Consultant', 'Blue Harbor Health', '$85.00', 'Apr 1, 2026 – Mar 31, 2027', b('Active'), memberAction('Kevin Singh', true)],
            [person('Priya Shah', 'Data Engineer · Coral Staffing'), 'Consultant', 'Meridian Retail Group', '$88.00', 'Nov 16, 2026 – May 14, 2027', b('Onboarding'), memberAction('Priya Shah', true)]
          ]
        }
      },
      {
        id: 'resourceAdd',
        parent: 'teamMembers',
        title: 'Add Resource',
        description: 'Add a W-2 or 1099 resource with personal, engagement and payment details.',
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
              title: 'Engagement',
              fields: [
                { label: 'Client', type: 'select', options: ['Blue Harbor Health', 'Northwind Labs', 'Apex Systems'] },
                { label: 'Role', value: 'Cloud Engineer' },
                { label: 'Hourly rate (USD)', value: '68.00' },
                { label: 'Work location', type: 'select', options: ['Hybrid — Chicago, IL', 'Remote', 'Onsite'] },
                { label: 'Start date', type: 'date', value: '2026-12-01' },
                { label: 'End date', type: 'date', value: '2027-11-30' },
                { label: 'Payment term', type: 'select', options: ['Net 15', 'Net 7', 'Net 30', 'Net 45', 'Net 60', 'Immediate', 'Custom'], customInput: true },
                { label: 'Duration', value: '12 months', readonly: true }
              ]
            },
            {
              title: 'W-2 documents',
              showFor: 'W-2 Employee',
              hint: 'Payslips accepts several files. Anything not uploaded now is marked Incomplete in the Document Tracker.',
              fields: [
                { label: 'W-4', type: 'upload' },
                { label: 'I-9', type: 'upload' },
                { label: 'Employment contract', type: 'upload', expiry: true },
                { label: 'W-2 (year end)', type: 'upload' },
                { label: 'Legal document (work authorization)', type: 'upload' },
                { label: 'ACH form', type: 'upload' },
                { label: 'Audit report', type: 'upload' },
                { label: 'Payslips', type: 'upload', multiple: true }
              ]
            },
            {
              title: '1099 documents',
              showFor: '1099 Contractor',
              hint: 'Anything not uploaded now is marked Incomplete in the Document Tracker.',
              fields: [
                { label: '1099 contract', type: 'upload', expiry: true },
                { label: 'W-9', type: 'upload' },
                { label: 'Legal document (work authorization)', type: 'upload' },
                { label: 'ACH form', type: 'upload' },
                { label: 'Audit report', type: 'upload' },
                { label: '1099 (year end)', type: 'upload' }
              ]
            }
          ],
          submit: { label: 'Save & Send Invite', target: 'teamMembers' },
          cancel: { label: 'Cancel', target: 'teamMembers' }
        }
      },
      {
        id: 'invoiceAudit',
        title: 'Invoices',
        description: 'All vendor and resource submissions with their reconciliation result. Super Admin can edit any invoice.',
        actions: [{ label: 'Export CSV', target: 'invoiceAudit' }],
        tabs: ['All (707)', 'Approved (512)', 'In Progress (141)', 'Rejected (38)', 'Not Submitted (16)'],
        table: {
          title: 'October 2026 submissions',
          total: 707,
          headers: ['Invoice #', 'Submitted by', 'Client', 'Period', 'Hours (sub / client)', 'Amount', 'Status', 'Actions'],
          rows: [
            [mono('INV-2026-10-0142'), person('Rinaldo Silva', 'Coral Staffing'), 'Apex Systems', 'Oct 2026', '168 / 168', '$12,096.00', b('Approved'), acts('View', 'Edit')],
            [mono('INV-2026-10-0151'), person('Jordan Blake', '1099'), 'Northwind Labs', 'Oct 2026', '152 / —', '$13,680.00', b('In Progress'), acts('View', 'Edit')],
            [mono('INV-2026-10-0187'), person('Kevin Singh', 'Summit IT'), 'Blue Harbor Health', 'Oct 2026', `${diff('160')} / 152`, '$13,600.00', b('Rejected'), acts('View', 'Edit')],
            [mono('TS-2026-10-0093'), person('Maya Reed', 'W-2 · timesheet'), 'Northwind Labs', 'Oct 2026', '168 / 168', '—', b('Approved'), acts('View')],
            [mono('INV-2026-10-0203'), person('Deepa Kumar', 'Coral Staffing'), 'Blue Harbor Health', 'Oct 2026', `${diff('160')} / 168`, '$12,800.00', b('Rejected'), acts('View', 'Edit')],
            [mono('INV-2026-10-0211'), person('Ana Torres', 'BluePeak Consulting'), 'GlobalCare Insurance', 'Oct 2026', '176 / 176', '$15,488.00', b('Approved'), acts('View', 'Edit')],
            ['—', person('Lena Fischer', 'Summit IT'), 'Blue Harbor Health', 'Oct 2026', '— / 168', '—', b('Not Submitted'), '<span class="person-sub inline">Due Nov 15</span>'],
            ['—', person('Ava Chen', '1099'), 'Northwind Labs', 'Oct 2026', '— / 160', '—', b('Not Submitted'), '<span class="person-sub inline">Due Nov 15</span>']
          ]
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
            ['MSA', 'Northwind Labs', 'Client', 'v3', 'Feb 12, 2027', b('Valid'), acts('View')],
            ['COI', 'Coral Staffing LLC', 'Vendor', 'v2', 'Nov 25, 2026', b('Expiring Soon'), acts('View', 'Remind')],
            ['Work authorization (H-1B)', 'Deepa Kumar', 'Consultant', 'v1', 'Nov 30, 2026', b('Expiring Soon'), acts('View', 'Remind')],
            ['MSA', 'Helix Biotech', 'Client', 'v1', 'Oct 31, 2026', b('Expired'), acts('View', 'Remind')],
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
            ['10:12 AM', person('Arun Krishnan', 'Super Admin'), 'Updated client', 'Apex Systems', `MSA end: Jan 30, 2027 → <b>Jan 30, 2028</b>`],
            ['09:58 AM', person('Alicia Ross', 'Account Manager'), 'Uploaded client invoice', 'Blue Harbor Health · Oct 2026', '— → BH-Oct26-Singh.pdf, BH-Oct26-Kumar.pdf'],
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
      { label: 'Reconciliation', target: 'reconciliation' },
      { label: 'Document Tracker', target: 'docs' },
      { label: 'Audit Log', target: 'auditLog' }
    ],
    screens: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Your 12 clients and 18 vendors. October 2026 billing closes Nov 15.',
        kpis: [
          { label: 'Assigned clients', value: '12', trend: '+1 this quarter', tone: 'up' },
          { label: 'Vendors in scope', value: '18', trend: '2 onboarding', tone: 'neutral' },
          { label: 'Awaiting client invoice', value: '9', trend: '3 clients outstanding', tone: 'warn' },
          { label: 'Rejected this cycle', value: '4', trend: '−3 vs. September', tone: 'up' }
        ],
        panels: [
          {
            title: 'Needs your attention',
            chip: '3 tasks',
            items: [
              { label: sub('Finish Oct client invoices — Blue Harbor Health', '3 of 5 people still waiting'), value: b('Due'), meta: 'Nov 12' },
              { label: sub('Upload Oct client invoice — Meridian Retail Group', '4 submissions waiting on it'), value: b('Due'), meta: 'Nov 12' },
              { label: sub('COI expiring — Coral Staffing LLC', 'Vendor notified Oct 26'), value: b('Expiring Soon'), meta: 'Nov 25' }
            ]
          },
          {
            title: 'October reconciliation',
            chip: '64 submissions',
            bars: [
              { label: 'Approved', value: 51, pct: 80, tone: 'approved', target: 'reconciliation', tab: 1 },
              { label: 'Awaiting client invoice', value: 9, pct: 14, tone: 'progress', target: 'reconciliation', tab: 2 },
              { label: 'Rejected', value: 4, pct: 6, tone: 'rejected', target: 'reconciliation', tab: 3 }
            ]
          }
        ],
        activity: [
          { who: 'System', what: 'rejected <b>INV-2026-10-0187</b> (Kevin Singh, Blue Harbor) — 160 h submitted vs. 152 h on client invoice', when: '12 min ago' },
          { who: 'Alicia Ross', what: 'uploaded Blue Harbor Health client invoices for Kevin Singh and Deepa Kumar', when: '12 min ago' },
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
          total: 12,
          headers: ['Client', 'Region', 'Vendors', 'People', 'MSA Expiry', 'Client invoice status', 'Actions'],
          rows: [
            [sub('Northwind Labs', 'America/New_York'), 'US-East', '3', '9', 'Feb 12, 2027', b('Uploaded'), `<div class="row-actions"><button class="link-btn" data-target="clientEdit">Open</button><button class="link-btn" data-target="clientHolidayCalendar">Holidays</button>${clientInvoiceAction('Northwind Labs')}</div>`],
            [sub('Blue Harbor Health', 'America/Chicago'), 'Central', '2', '5', `Dec 09, 2026 ${b('Expiring Soon')}`, `${b('In Progress')} <span class="person-sub inline">2 of 5</span>`, `<div class="row-actions"><button class="link-btn" data-target="clientEdit">Open</button><button class="link-btn" data-target="clientHolidayCalendar">Holidays</button>${clientInvoiceAction('Blue Harbor Health')}</div>`],
            [sub('Meridian Retail Group', 'America/Toronto'), 'Canada', '2', '4', 'Mar 31, 2027', b('Pending'), `<div class="row-actions"><button class="link-btn" data-target="clientEdit">Open</button><button class="link-btn" data-target="clientHolidayCalendar">Holidays</button>${clientInvoiceAction('Meridian Retail Group')}</div>`],
            [sub('Lumen Logistics', 'America/New_York'), 'US-East', '1', '3', 'Aug 15, 2027', b('Uploaded'), `<div class="row-actions"><button class="link-btn" data-target="clientEdit">Open</button><button class="link-btn" data-target="clientHolidayCalendar">Holidays</button>${clientInvoiceAction('Lumen Logistics')}</div>`]
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
            [sub('Coral Staffing LLC', 'Austin, TX'), sub('Daniel Ortiz', 'd.ortiz@coralstaffing.com'), '12', 'Blue Harbor, Apex, Meridian', b('Active'), `<div class="row-actions"><button class="link-btn" data-target="vendorEdit">View / Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`],
            [sub('Summit IT Solutions', 'Edison, NJ'), sub('Ravi Menon', 'ravi@summitits.com'), '19', 'Blue Harbor, Northwind', b('Active'), `<div class="row-actions"><button class="link-btn" data-target="vendorEdit">View / Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`],
            [sub('Ridgeline Talent Group', 'Charlotte, NC'), sub('Megan Price', 'mprice@ridgelinetalent.com'), '4', 'Northwind Labs', b('Onboarding'), `<div class="row-actions"><button class="link-btn" data-target="vendorEdit">View / Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`],
            [sub('Cascade Data Partners', 'Seattle, WA'), sub('Tom Hughes', 'tom@cascadedata.io'), '2', 'Lumen Logistics', b('Active'), `<div class="row-actions"><button class="link-btn" data-target="vendorEdit">View / Edit</button><button class="link-btn" data-target="vendorInvoices">Vendor Invoice</button><button class="link-btn" data-target="vendorConsultants">Consultants</button></div>`]
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
                { label: 'Account manager', type: 'select', options: ['Alicia Ross', 'Benjamin Cole', 'Priya Natarajan'], required: true }
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
            [mono('INV-2026-10-0203'), person('Deepa Kumar'), 'Blue Harbor Health', '160', '$12,800.00', 'Nov 3', b('Rejected'), '<div class="row-actions"><button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0203">View</button><button class="link-btn" data-target="rejectedInvoice">Correct</button></div>'],
            [mono('INV-2026-10-0142'), person('Rinaldo Silva'), 'Apex Systems', '168', '$12,096.00', 'Nov 4 (v2)', b('Approved'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0142">View</button>'],
            [mono('INV-2026-10-0198'), person('Omar Haddad'), 'Blue Harbor Health', '144', '$12,096.00', 'Nov 3', b('In Progress'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0198">View</button>'],
            [mono('INV-2026-10-0176'), person('Sofia Marin'), 'Meridian Retail Group', '168', '$12,768.00', 'Nov 2', b('In Progress'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0176">View</button>']
          ]
        }
      },
      {
        id: 'vendorConsultants',
        parent: 'vendorList',
        title: 'Vendor Consultants',
        description: 'Consultants associated with the selected vendor and their current client engagements.',
        actions: [{ label: 'Add Consultant', target: 'consultantAdd', primary: true }],
        table: {
          title: 'Coral Staffing consultants',
          total: 12,
          headers: ['Consultant', 'Client', 'Hourly Rate', 'Engagement', 'Location', 'Status', 'Actions'],
          rows: [
            [person('Deepa Kumar', 'Business Analyst'), 'Blue Harbor Health', '$80.00', 'Jan 12 – Dec 31, 2026', 'Hybrid', b('Active'), acts('View', 'Edit')],
            [person('Rinaldo Silva', 'QA Engineer'), 'Apex Systems', '$72.00', 'Sep 14, 2026 – Mar 12, 2027', 'Remote', b('Active'), acts('View', 'Edit')],
            [person('Omar Haddad', 'DevOps Engineer'), 'Blue Harbor Health', '$84.00', 'Feb 2, 2026 – Jan 29, 2027', 'Onsite', b('Active'), acts('View', 'Edit')],
            [person('Sofia Marin', 'Scrum Master'), 'Meridian Retail Group', '$76.00', 'May 4, 2026 – Nov 27, 2026', 'Remote', b('Active'), acts('View', 'Edit')],
            [person('Priya Shah', 'Data Engineer'), 'Meridian Retail Group', '$88.00', 'Nov 16, 2026 – May 14, 2027', 'Remote', b('Onboarding'), acts('View', 'Edit')]
          ]
        }
      },
      {
        id: 'consultantAdd',
        parent: 'vendorConsultants',
        title: 'Add Consultant',
        description: 'Add a consultant and their first client engagement.',
        form: {
          sections: [
            {
              title: 'Consultant & engagement',
              fields: [
                { label: 'Consultant name', value: 'Marcus Lee', required: true },
                { label: 'Role', value: 'Salesforce Developer', required: true },
                { label: 'Client', type: 'select', options: ['Apex Systems', 'Blue Harbor Health', 'Meridian Retail Group'], required: true },
                { label: 'Hourly rate (USD)', value: '92.00', required: true },
                { label: 'Start date', type: 'date', value: '2026-12-07' },
                { label: 'End date', type: 'date', value: '2027-06-04' },
                { label: 'Duration', value: '26 weeks', readonly: true },
                { label: 'Work location', type: 'select', options: ['Remote', 'Hybrid — San Francisco, CA', 'Onsite'] }
              ]
            },
            {
              title: 'Documents',
              hint: 'PDF, DOCX, JPG or PNG · max 5 MB each. Missing documents can be added later.',
              fields: [
                { label: 'Resume', type: 'upload', file: 'Marcus_Lee_Resume.pdf', size: '186 KB' },
                { label: 'Work authorization (start / end date)', type: 'upload', file: 'Lee_EAD_2026.pdf', size: '1.2 MB' },
                { label: 'I-9 audit report', type: 'upload' },
                { label: 'E-Verify document', type: 'upload' }
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
            [person('Maya Reed', 'Data Analyst'), 'W-2', 'Northwind Labs', '$62.00', b('Approved'), b('Active'), memberAction('Maya Reed', true)],
            [person('Jordan Blake', 'UX Consultant'), '1099', 'Northwind Labs', '$90.00', b('In Progress'), b('Active'), memberAction('Jordan Blake', true)],
            [person('Deepa Kumar', 'Business Analyst · Coral Staffing'), 'Consultant', 'Blue Harbor Health', '$80.00', b('Rejected'), b('Active'), memberAction('Deepa Kumar', true)],
            [person('Kevin Singh', 'Java Developer · Summit IT'), 'Consultant', 'Blue Harbor Health', '$85.00', b('Rejected'), b('Active'), memberAction('Kevin Singh', true)],
            [person('Priya Shah', 'Data Engineer · Coral Staffing'), 'Consultant', 'Meridian Retail Group', '$88.00', b('Not Started'), b('Onboarding'), memberAction('Priya Shah', true)]
          ]
        }
      },
      {
        id: 'invoiceUpload',
        title: 'Invoice Management',
        description: 'Upload each client’s monthly invoice and billable hours per person. Saving triggers reconciliation automatically.',
        filters: [
          { label: 'Client', options: ['Blue Harbor Health', 'Northwind Labs', 'Meridian Retail Group', 'Lumen Logistics'] },
          { label: 'Billing period', options: ['October 2026', 'September 2026', 'August 2026'] }
        ],
        table: {
          title: 'Blue Harbor Health · October 2026',
          chip: '5 people · 3 awaiting client invoice',
          noSearch: true,
          headers: ['Person', 'Type', 'Submitted Hours', 'Client Invoice', 'Client Billable Hours', 'Submission'],
          rows: [
            [person('Deepa Kumar', 'Coral Staffing'), 'Consultant', '160', fileChip('BH-Oct26-Kumar.pdf', '420 KB'), '<input class="cell-input" value="168" />', b('Rejected')],
            [person('Kevin Singh', 'Summit IT'), 'Consultant', '160', fileChip('BH-Oct26-Singh.pdf', '418 KB'), '<input class="cell-input" value="152" />', b('Rejected')],
            [person('Lena Fischer', 'Summit IT'), 'Consultant', '168', '<button class="upload-mini">Upload</button>', '<input class="cell-input" placeholder="0" />', b('Awaiting Client Invoice')],
            [person('Omar Haddad', 'Coral Staffing'), 'Consultant', '144', '<button class="upload-mini">Upload</button>', '<input class="cell-input" placeholder="0" />', b('Awaiting Client Invoice')],
            [person('Grace Liu', 'W-2'), 'W-2', '168', '<button class="upload-mini">Upload</button>', '<input class="cell-input" placeholder="0" />', b('Awaiting Client Invoice')]
          ]
        },
        footerActions: [
          { label: 'Save & Reconcile', target: 'reconciliation', primary: true },
          { label: 'Save Draft', target: 'invoiceUpload' }
        ]
      },
      {
        id: 'reconciliation',
        title: 'Reconciliation',
        description: 'Automatic match of each submission against the client invoice on billing period and total hours.',
        tabs: ['All (64)', 'Approved (51)', 'Awaiting Client Invoice (9)', 'Rejected (4)'],
        table: {
          title: 'October 2026',
          total: 64,
          headers: ['Person', 'Client', 'Period', 'Submitted', 'Client Invoice', 'Result', 'Reason'],
          rows: [
            [person('Maya Reed', 'W-2'), 'Northwind Labs', 'Oct 2026', '168 h', '168 h', b('Approved'), '—'],
            [person('Rinaldo Silva', 'Coral Staffing'), 'Apex Systems', 'Oct 2026', '168 h', '168 h', b('Approved'), 'Matched on resubmission (v2)'],
            [person('Jordan Blake', '1099'), 'Northwind Labs', 'Oct 2026', '152 h', '—', b('Awaiting Client Invoice'), '—'],
            [person('Kevin Singh', 'Summit IT'), 'Blue Harbor Health', 'Oct 2026', diff('160 h'), '152 h', b('Rejected'), 'Total hours: expected 152, submitted 160'],
            [person('Deepa Kumar', 'Coral Staffing'), 'Blue Harbor Health', 'Oct 2026', diff('160 h'), '168 h', b('Rejected'), 'Total hours: expected 168, submitted 160']
          ]
        }
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
            ['MSA', 'Blue Harbor Health', 'Client', 'Dec 09, 2026', b('Expiring Soon'), acts('View')],
            ['ACH form', 'Ridgeline Talent Group', 'Vendor', '—', b('Incomplete'), acts('Request')],
            ['W-9', 'Summit IT Solutions', 'Vendor', 'Jul 01, 2027', b('Valid'), acts('View')]
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
            ['09:58 AM', person('Alicia Ross', 'Account Manager'), 'Uploaded client invoice', 'Blue Harbor Health · Oct 2026', '— → BH-Oct26-Singh.pdf, BH-Oct26-Kumar.pdf'],
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
        description: 'Coral Staffing LLC · Account manager: Alicia Ross. October 2026 invoices are due Nov 15.',
        alert: {
          tone: 'danger',
          title: '1 invoice was rejected and needs correction',
          text: 'INV-2026-10-0203 · Deepa Kumar · Blue Harbor Health — total hours do not match the client invoice.',
          action: { label: 'Fix now', target: 'rejectedInvoice' }
        },
        kpis: [
          { label: 'Active consultants', value: '12', trend: '1 starting Nov 16', tone: 'neutral' },
          { label: 'Approved — Oct 2026', value: '8', trend: 'of 12 submitted', tone: 'up' },
          { label: 'Rejected to fix', value: '1', trend: 'Action needed', tone: 'down' },
          { label: 'Expiring documents', value: '2', trend: 'Next: COI · Nov 25', tone: 'warn' }
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
              { label: sub('COI', 'Certificate of insurance'), value: b('Expiring Soon'), meta: 'Nov 25' },
              { label: sub('Work authorization — Deepa Kumar', 'Consultant document'), value: b('Expiring Soon'), meta: 'Nov 30' },
              { label: sub('MSA', 'Jan 1, 2026 – Dec 31, 2027'), value: b('Valid'), meta: '' },
              { label: sub('W-9', 'Tax year 2026'), value: b('Valid'), meta: '' }
            ]
          }
        ],
        activity: [
          { who: 'System', what: 'rejected <b>INV-2026-10-0203</b> (Deepa Kumar) — 160 h submitted vs. 168 h on client invoice', when: '12 min ago' },
          { who: 'Daniel Ortiz', what: 'added consultant <b>Priya Shah</b>', when: '39 min ago' },
          { who: 'System', what: 'approved <b>INV-2026-10-0142</b> (Rinaldo Silva) after resubmission', when: '1 hr ago' }
        ]
      },
      {
        id: 'consultants',
        title: 'Consultants',
        description: 'Your consultants and their client engagements.',
        actions: [{ label: 'Add Consultant', target: 'consultantAdd', primary: true }],
        table: {
          title: 'Coral Staffing consultants',
          total: 12,
          headers: ['Consultant', 'Client', 'Hourly Rate', 'Engagement', 'Location', 'Status', 'Actions'],
          rows: [
            [person('Deepa Kumar', 'Business Analyst'), 'Blue Harbor Health', '$80.00', 'Jan 12 – Dec 31, 2026', 'Hybrid', b('Active'), acts('View', 'Edit')],
            [person('Rinaldo Silva', 'QA Engineer'), 'Apex Systems', '$72.00', 'Sep 14, 2026 – Mar 12, 2027', 'Remote', b('Active'), acts('View', 'Edit')],
            [person('Omar Haddad', 'DevOps Engineer'), 'Blue Harbor Health', '$84.00', 'Feb 2, 2026 – Jan 29, 2027', 'Onsite', b('Active'), acts('View', 'Edit')],
            [person('Sofia Marin', 'Scrum Master'), 'Meridian Retail Group', '$76.00', 'May 4, 2026 – Nov 27, 2026', 'Remote', b('Active'), acts('View', 'Edit')],
            [person('Priya Shah', 'Data Engineer'), 'Meridian Retail Group', '$88.00', 'Nov 16, 2026 – May 14, 2027', 'Remote', b('Onboarding'), acts('View', 'Edit')]
          ]
        }
      },
      {
        id: 'consultantAdd',
        parent: 'consultants',
        title: 'Add Consultant',
        description: 'Add a consultant and their first client engagement.',
        form: {
          sections: [
            {
              title: 'Consultant & engagement',
              fields: [
                { label: 'Consultant name', value: 'Marcus Lee', required: true },
                { label: 'Role', value: 'Salesforce Developer', required: true },
                { label: 'Client', type: 'select', options: ['Apex Systems', 'Blue Harbor Health', 'Meridian Retail Group'], required: true },
                { label: 'Hourly rate (USD)', value: '92.00', required: true },
                { label: 'Start date', type: 'date', value: '2026-12-07' },
                { label: 'End date', type: 'date', value: '2027-06-04' },
                { label: 'Duration', value: '26 weeks', readonly: true },
                { label: 'Work location', type: 'select', options: ['Remote', 'Hybrid — San Francisco, CA', 'Onsite'] }
              ]
            },
            {
              title: 'Documents',
              hint: 'PDF, DOCX, JPG or PNG · max 5 MB each. Missing documents can be added later.',
              fields: [
                { label: 'Resume', type: 'upload', file: 'Marcus_Lee_Resume.pdf', size: '186 KB' },
                { label: 'Work authorization (start / end date)', type: 'upload', file: 'Lee_EAD_2026.pdf', size: '1.2 MB' },
                { label: 'I-9 audit report', type: 'upload' },
                { label: 'E-Verify document', type: 'upload' }
              ]
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
        actions: [{ label: 'Submit Invoice', target: 'invoiceSubmit', primary: true }],
        tabs: ['All (12)', 'Approved (8)', 'In Progress (3)', 'Rejected (1)'],
        table: {
          title: 'October 2026',
          total: 12,
          headers: ['Invoice #', 'Consultant', 'Client', 'Hours', 'Amount', 'Submitted', 'Status', 'Actions'],
          rows: [
            [mono('INV-2026-10-0203'), person('Deepa Kumar'), 'Blue Harbor Health', '160', '$12,800.00', 'Nov 3', b('Rejected'), '<div class="row-actions"><button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0203">View</button><button class="link-btn" data-target="rejectedInvoice">Correct</button></div>'],
            [mono('INV-2026-10-0142'), person('Rinaldo Silva'), 'Apex Systems', '168', '$12,096.00', 'Nov 4 (v2)', b('Approved'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0142">View</button>'],
            [mono('INV-2026-10-0198'), person('Omar Haddad'), 'Blue Harbor Health', '144', '$12,096.00', 'Nov 3', b('In Progress'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0198">View</button>'],
            [mono('INV-2026-10-0176'), person('Sofia Marin'), 'Meridian Retail Group', '168', '$12,768.00', 'Nov 2', b('In Progress'), '<button class="link-btn" data-target="invoiceDetail" data-inv="INV-2026-10-0176">View</button>']
          ]
        }
      },
      {
        id: 'invoiceSubmit',
        parent: 'invoices',
        title: 'Submit Invoice',
        description: 'One invoice per consultant, client and billing period, with its timesheet.',
        form: {
          sections: [
            {
              title: 'Engagement',
              fields: [
                { label: 'Consultant', type: 'select', options: ['Omar Haddad — Blue Harbor Health', 'Sofia Marin — Meridian Retail Group'], required: true },
                { label: 'Billing period', type: 'select', options: ['October 2026', 'September 2026'], required: true },
                { label: 'Total billed hours', value: '144', required: true },
                { label: 'Hourly rate', value: '$84.00', readonly: true },
                { label: 'Invoice amount (USD)', value: '$12,096.00', readonly: true },
                { label: 'Payment term', value: 'Net 30', readonly: true }
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
        description: 'INV-2026-10-0203 · Deepa Kumar · Blue Harbor Health · October 2026',
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
        description: 'Company documents. Replacing a document keeps the earlier version in history.',
        table: {
          title: 'Coral Staffing LLC',
          total: 5,
          headers: ['Document', 'Validity', 'Version', 'Last Updated', 'Status', 'Actions'],
          rows: [
            ['MSA', 'Jan 1, 2026 – Dec 31, 2027', 'v2', 'Jan 3, 2026', b('Valid'), acts('Download', 'Replace')],
            ['PO #PO-38817', 'Jan 1 – Dec 31, 2026', 'v1', 'Jan 3, 2026', b('Valid'), acts('Download', 'Replace')],
            ['W-9', 'Tax year 2026', 'v3', 'Feb 11, 2026', b('Valid'), acts('Download', 'Replace')],
            ['COI', 'Nov 26, 2025 – Nov 25, 2026', 'v2', 'Nov 20, 2025', b('Expiring Soon'), acts('Download', 'Replace')],
            ['ACH form', '—', 'v1', 'Jan 3, 2026', b('Valid'), acts('Download', 'Replace')]
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
                { label: 'Account manager', value: 'Alicia Ross', readonly: true, lock: 'Admin-managed' }
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
      { label: 'My Engagements', target: 'engagements' },
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
          { label: 'Active engagements', value: '2', trend: 'Northwind · Meridian', tone: 'neutral' },
          { label: 'October timesheets', value: '2 of 2', trend: 'Submitted', tone: 'up' },
          { label: 'Approved this year', value: '17', trend: 'No open rejections', tone: 'up' },
          { label: 'Documents to action', value: '1', trend: 'I-9 incomplete', tone: 'warn' }
        ],
        panels: [
          {
            title: 'Current engagements',
            chip: '2 active',
            items: [
              { label: sub('Northwind Labs', 'Data Analyst · Remote · through Feb 26, 2027'), value: b('Active'), meta: '' },
              { label: sub('Meridian Retail Group', 'Reporting Analyst · part-time · through Dec 18, 2026'), value: b('Active'), meta: '' }
            ]
          },
          {
            title: 'Submission status by month',
            chip: 'Last 3 months',
            items: [
              { label: sub('October 2026', 'Northwind 168 h · Meridian 40 h'), value: b('In Progress'), meta: '' },
              { label: sub('September 2026', 'Northwind 160 h · Meridian 40 h'), value: b('Approved'), meta: '' },
              { label: sub('August 2026', 'Northwind 168 h · Meridian 36 h'), value: b('Approved'), meta: '' }
            ]
          }
        ]
      },
      {
        id: 'engagements',
        title: 'My Engagements',
        description: 'Your active client engagements.',
        table: {
          title: 'Engagements',
          total: 2,
          headers: ['Client', 'Role', 'Location', 'Start', 'End', 'Payment Term', 'Status'],
          rows: [
            ['Northwind Labs', 'Data Analyst', 'Remote', 'Mar 2, 2026', 'Feb 26, 2027', 'Net 15', b('Active')],
            ['Meridian Retail Group', 'Reporting Analyst (part-time)', 'Remote', 'Sep 8, 2026', 'Dec 18, 2026', 'Net 15', b('Active')]
          ]
        }
      },
      {
        id: 'status',
        title: 'Timesheets',
        description: 'Each timesheet is matched against the client invoice hours.',
        actions: [{ label: 'Submit Timesheet', target: 'timesheet', primary: true }],
        table: {
          title: 'Submission history',
          total: 6,
          headers: ['Period', 'Client', 'Hours', 'Timesheet', 'Submitted', 'Status'],
          rows: [
            ['October 2026', 'Northwind Labs', '168', fileChip('Reed_Oct26.pdf'), 'Nov 2', b('Approved')],
            ['October 2026', 'Meridian Retail Group', '40', fileChip('Reed_Meridian_Oct26.pdf'), 'Nov 2', b('Awaiting Client Invoice')],
            ['September 2026', 'Northwind Labs', '160', fileChip('Reed_Sep26_v2.pdf'), 'Oct 6 (v2)', b('Approved')],
            ['September 2026', 'Meridian Retail Group', '40', fileChip('Reed_Meridian_Sep26.pdf'), 'Oct 2', b('Approved')]
          ]
        }
      },
      {
        id: 'timesheet',
        parent: 'status',
        title: 'Submit Timesheet',
        description: 'One timesheet per client engagement and month.',
        form: {
          sections: [
            {
              title: 'Timesheet',
              fields: [
                { label: 'Engagement', type: 'select', options: ['Meridian Retail Group — Reporting Analyst', 'Northwind Labs — Data Analyst'], required: true },
                { label: 'Billing period', type: 'select', options: ['November 2026', 'October 2026'], required: true },
                { label: 'Total hours', value: '40', required: true },
                { label: 'Timesheet', type: 'upload', file: 'Reed_Meridian_Nov26.pdf', size: '88 KB' }
              ]
            }
          ],
          submit: { label: 'Submit Timesheet', target: 'status' },
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
      { label: 'My Engagements', target: 'engagements' },
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
          title: 'Your September invoice for Apex Systems was rejected',
          text: 'INV-2026-09-0388 — billing period did not match the client invoice.',
          action: { label: 'Correct invoice', target: 'correction' }
        },
        kpis: [
          { label: 'Active engagements', value: '2', trend: 'Northwind · Apex', tone: 'neutral' },
          { label: 'Billed in October', value: '$22,044', trend: '152 h + 102 h', tone: 'neutral' },
          { label: 'Rejected to fix', value: '1', trend: 'Action needed', tone: 'down' },
          { label: 'Documents', value: 'All valid', trend: '1099 form due Jan 2027', tone: 'up' }
        ],
        panels: [
          {
            title: 'Invoices by month',
            chip: 'Last 3 months',
            items: [
              { label: sub('October 2026', 'Northwind $13,680.00 · Apex $8,364.00'), value: b('In Progress'), meta: '' },
              { label: sub('September 2026', 'Northwind $14,400.00 · Apex $8,856.00'), value: b('Rejected'), meta: '' },
              { label: sub('August 2026', 'Northwind $15,120.00 · Apex $9,184.00'), value: b('Approved'), meta: '' }
            ]
          },
          {
            title: 'Current engagements',
            chip: '2 active',
            items: [
              { label: sub('Northwind Labs', 'UX Consultant · $90.00/hr · Net 15'), value: b('Active'), meta: '' },
              { label: sub('Apex Systems', 'Product Analyst · $82.00/hr · Net 30'), value: b('Active'), meta: '' }
            ]
          }
        ]
      },
      {
        id: 'engagements',
        title: 'My Engagements',
        description: 'Your active 1099 engagements.',
        table: {
          title: 'Engagements',
          total: 2,
          headers: ['Client', 'Job Title', 'Hourly Rate', 'Location', 'Term', 'Payment Term', 'Status'],
          rows: [
            ['Northwind Labs', 'UX Consultant', '$90.00', 'Remote', 'Jul 6, 2026 – Jan 8, 2027', 'Net 15', b('Active')],
            ['Apex Systems', 'Product Analyst', '$82.00', 'Remote', 'Aug 3, 2026 – Feb 5, 2027', 'Net 30', b('Active')]
          ]
        }
      },
      {
        id: 'status',
        title: 'Invoices',
        description: 'Your submitted invoices and their reconciliation result.',
        actions: [{ label: 'Submit Invoice', target: 'invoiceSubmit', primary: true }],
        table: {
          title: 'Invoice history',
          total: 8,
          headers: ['Invoice #', 'Client', 'Period', 'Hours', 'Amount', 'Status', 'Actions'],
          rows: [
            [mono('INV-2026-10-0151'), 'Northwind Labs', 'Oct 2026', '152', '$13,680.00', b('Awaiting Client Invoice'), invoiceViewAction('INV-2026-10-0151')],
            [mono('INV-2026-10-0164'), 'Apex Systems', 'Oct 2026', '102', '$8,364.00', b('Approved'), invoiceViewAction('INV-2026-10-0164')],
            [mono('INV-2026-09-0388'), 'Apex Systems', 'Sep 2026', '108', '$8,856.00', b('Rejected'), `<div class="row-actions">${invoiceViewAction('INV-2026-09-0388')}<button class="link-btn" data-target="correction">Correct</button></div>`],
            [mono('INV-2026-09-0352'), 'Northwind Labs', 'Sep 2026', '160', '$14,400.00', b('Approved'), invoiceViewAction('INV-2026-09-0352')]
          ]
        }
      },
      {
        id: 'invoiceSubmit',
        parent: 'status',
        title: 'Submit Invoice',
        description: 'Invoice and timesheet, per client engagement and month.',
        form: {
          sections: [
            {
              title: 'Invoice',
              fields: [
                { label: 'Engagement', type: 'select', options: ['Northwind Labs — UX Consultant', 'Apex Systems — Product Analyst'], required: true },
                { label: 'Billing period', type: 'select', options: ['November 2026', 'October 2026'], required: true },
                { label: 'Total billed hours', value: '136', required: true },
                { label: 'Hourly rate', value: '$90.00', readonly: true },
                { label: 'Invoice amount (USD)', value: '$12,240.00', readonly: true },
                { label: 'Payment term', value: 'Net 15', readonly: true }
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
          submit: { label: 'Submit Invoice', target: 'status' },
          cancel: { label: 'Cancel', target: 'status' }
        }
      },
      {
        id: 'correction',
        parent: 'status',
        title: 'Correct Rejected Invoice',
        description: 'INV-2026-09-0388 · Apex Systems · Product Analyst',
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
            ['Total hours', '108', '108', b('Matched')]
          ]
        },
        form: {
          sections: [
            {
              title: 'Corrected submission (v2)',
              fields: [
                { label: 'Billing period', type: 'select', options: ['September 2026', 'August 2026'] },
                { label: 'Total billed hours', value: '108' },
                { label: 'Corrected invoice', type: 'upload', file: 'BlakeUX-0041-R1.pdf', size: '150 KB' },
                { label: 'Timesheet', type: 'upload', file: 'Blake_Apex_Sep26.pdf', size: '92 KB' }
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
          total: 5,
          headers: ['Document', 'Last Updated', 'Expires', 'Status', 'Actions'],
          rows: [
            ['1099 contract — Northwind Labs', 'Jul 1, 2026', 'Jan 8, 2027', b('Signed'), acts('View')],
            ['1099 contract — Apex Systems', 'Jul 28, 2026', 'Feb 5, 2027', b('Signed'), acts('View')],
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

  // Client edit and holiday calendar for the AM's own clients (PRD: R, U own clients; no delete).
  ['clientEdit', 'clientHolidayCalendar'].forEach((id) => {
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
      title: 'Admin User Management',
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
      { id: 'invoiceDetail', parent: key === 'superadmin' ? 'invoiceAudit' : 'vendorInvoices', title: 'Invoice' },
      { id: 'invoiceUpdate', parent: key === 'superadmin' ? 'invoiceAudit' : 'vendorInvoices', title: 'Update Invoice' }
    );
  });
  personaConfig.vendor.screens.push({ id: 'invoiceDetail', parent: 'invoices', title: 'Invoice' });

  // Document Tracker: View opens the document with its full version history.
  personaConfig.superadmin.screens.push({ id: 'docDetail', parent: 'documentTracker', title: 'Document' });
  personaConfig.accountmanager.screens.push({ id: 'docDetail', parent: 'docs', title: 'Document' });

  // 1099 resource: View on an invoice shows the invoice and timesheet.
  personaConfig.w9.screens.push({ id: 'invoiceView', parent: 'status', title: 'Invoice' });
})();

/* Buttons shared across personas can name a screen another persona owns.
   Send those to the nearest equivalent; ignore anything else unmatched. */
const TARGET_ALIASES = {
  superadmin: { reconciliation: 'invoiceAudit', rejectedInvoice: 'invoiceAudit' },
  accountmanager: { rejectedInvoice: 'reconciliation' }
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
let selectedClientInvoiceClient = 'Blue Harbor Health';

/* ---------- Sign-in: staff password, or one-time code for vendors / resources ---------- */

function enterApp(personaKey) {
  activePersona = personaKey;
  activeScreen = 'dashboard';
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  render();
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

function setPersona(personaKey) {
  activePersona = personaKey;
  activeScreen = 'dashboard';
  activeTab = 0;
  render();
}

function goToScreen(screenId, clientName, tab = 0) {
  if (screenId === 'invoiceUpload' && clientName) {
    selectedClientInvoiceClient = clientName;
  }
  activeTab = tab;
  activeScreen = screenId;
  render();
  window.scrollTo({ top: 0 });
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
  currentPersona().nav.forEach((item) => {
    const button = document.createElement('button');
    button.textContent = item.label;
    button.className = item.target === screen.id || item.target === navKey ? 'active' : '';
    button.addEventListener('click', () => goToScreen(item.target));
    leftNav.appendChild(button);
  });
}

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
  select.addEventListener('change', () => setPersona(select.value));
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
  const crumbs = ['Home'];
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
    <div class="kpi-row">
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
          ? `<button type="button" class="bar-row bar-link" data-target="${bar.target}" data-tab="${bar.tab || 0}" title="View ${bar.label.toLowerCase()} invoices">${inner}</button>`
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
  return `<div class="content-grid">${panels.map(createPanel).join('')}</div>`;
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
  if (!screen.tabs || !screen.table) return screen;
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
          <select>${f.options.map((o) => `<option ${f.label === 'Client' && o === (selectedClientInvoiceClient || 'Blue Harbor Health') ? 'selected' : ''}>${o}</option>`).join('')}</select>
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
      control = `<select ${field.customInput ? 'data-custom-select' : ''}>${options.map((o) => `<option>${o}</option>`).join('')}</select>`;
      if (field.customInput) {
        control += `<div class="custom-term-row" hidden>
            <input class="custom-term" placeholder="Enter term, e.g. Net 10 or Net 20" />
            <button type="button" class="btn btn-secondary btn-sm custom-term-add">Add</button>
          </div>
          <span class="field-note" hidden>Use the format Net + number of days, e.g. Net 10.</span>`;
      }
      break;
    }
    case 'date':
      control = `<input type="date" value="${field.value || ''}" />`;
      break;
    case 'textarea':
      control = `<textarea>${field.value || ''}</textarea>`;
      break;
    case 'upload':
      control = field.file
        ? `<div class="upload-done">${fileChip(field.file, field.size)}<button class="link-btn">Replace</button></div>`
        : `<div class="upload-box" ${field.multiple ? 'data-multiple' : ''}>${field.multiple ? 'Drop files or' : 'Drop file or'} <span class="link-text">browse</span><span class="person-sub">PDF, DOCX, JPG, PNG · max 5 MB${field.multiple ? ' each · multiple files allowed' : ''}</span>
            <input type="file" class="upload-input" accept=".pdf,.docx,.jpg,.jpeg,.png" ${field.multiple ? 'multiple' : ''} hidden />
          </div>
          <div class="upload-list"></div>`;
      if (field.expiry) {
        control += '<div class="expiry-row"><span class="expiry-label">Expiry date</span><input type="date" /></div>';
      }
      break;
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
    case 'chips':
      control = `<div class="chip-row">${field.options.map((o) => `<span class="chip">${o}<span class="chip-x">×</span></span>`).join('')}<button class="chip chip-add">+ Add holiday</button></div>`;
      break;
    case 'segmented':
      control = `<div class="segmented">${field.options.map((o, i) => `<button class="seg ${i === field.selected ? 'active' : ''}">${o}</button>`).join('')}</div>`;
      break;
    default:
      control = `<input value="${field.value || ''}" ${field.placeholder ? `placeholder="${field.placeholder}"` : ''} ${field.readonly ? 'readonly class="readonly"' : ''} />`;
  }

  return `<div class="field ${field.full ? 'full' : ''}">${label}${control}${field.note ? `<span class="person-sub">${field.note}</span>` : ''}</div>`;
}

function createForm(form) {
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
          <div class="form-grid">${section.fields.map(createField).join('')}</div>
        </div>
      `).join('')}
      <div class="form-footer">
        <span class="person-sub inline"><span class="req">*</span> Required</span>
        <div class="form-buttons">
          ${form.delete ? `<button class="btn btn-secondary btn-delete" data-target="${form.delete.target}">${form.delete.label}</button>` : ''}
          ${form.cancel ? `<button class="btn btn-secondary" data-target="${form.cancel.target}">${form.cancel.label}</button>` : ''}
          <button class="btn btn-primary" data-target="${form.submit.target}" ${form.submit.action ? `data-action="${form.submit.action}"` : ''}>${form.submit.label}</button>
        </div>
      </div>
    </div>
  `;
}

function createFooterActions(actions) {
  if (!actions) return '';
  return `<div class="form-buttons page-footer">${[...actions].reverse().map((a) => `<button class="btn ${a.primary ? 'btn-primary' : 'btn-secondary'}" data-target="${a.target}">${a.label}</button>`).join('')}</div>`;
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

function resolveScreenState(screen) {
  if (screen.id === 'memberDetail') return memberDetailScreen(screen, selectedMember);
  if (screen.id === 'memberEdit') return memberEditScreen(screen, selectedMember);
  if (screen.id === 'memberSubmissions') return memberSubmissionsScreen(screen, selectedMember);
  if (screen.id === 'submitOnBehalf') return submitOnBehalfScreen(screen, selectedMember);
  if (screen.id === 'invoiceView') return invoiceViewScreen(screen, selectedInvoice);
  if (screen.id === 'documentTracker' || (screen.id === 'docs' && activePersona === 'accountmanager')) return { ...screen, table: trackerTable(screen.table) };
  if (screen.id === 'docDetail') return docDetailScreen(screen, selectedDoc);
  if (screen.id === 'invoiceAudit') return { ...screen, table: auditInvoicesTable(screen.table) };
  if (screen.id === 'vendorInvoices') return { ...screen, table: vendorInvoicesTable(screen.table) };
  if (screen.id === 'invoiceDetail') return invoiceDetailScreen(screen, selectedInv);
  if (screen.id === 'invoiceUpdate') return invoiceUpdateScreen(screen, selectedInv);
  if (screen.id === 'adminUsers') return adminUsersScreen(screen);
  if (screen.id === 'adminUserAdd') return adminUserAddScreen(screen);
  if (screen.id === 'adminUserEdit') return adminUserEditScreen(screen);
  if (screen.id !== 'invoiceUpload') return screen;

  const clientName = selectedClientInvoiceClient || 'Blue Harbor Health';
  return {
    ...screen,
    filters: screen.filters.map((filter) => ({
      ...filter,
      options: filter.label === 'Client' ? ['Blue Harbor Health', 'Northwind Labs', 'Meridian Retail Group', 'Lumen Logistics'] : filter.options
    })),
    table: {
      ...screen.table,
      title: `${clientName} · October 2026`,
      rows: getClientInvoiceRows(clientName)
    }
  };
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

const customTerms = [];
const UPLOAD_TYPES = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

function fmtSize(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function wireFormControls(root) {
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
    box.addEventListener('click', () => input.click());
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
      if (!picked.length) { showFieldError(form, 'Clients', 'Select at least one client for this account manager.'); ok = false; }
      if (removed.length) {
        showFieldError(form, 'Clients', `${removed.join(', ')} would be left without an account manager. Assign ${removed.length > 1 ? 'them' : 'it'} to another account manager instead.`);
        ok = false;
      }
      if (!ok) { event.stopPropagation(); return; } // stay on the form

      const oldName = editing ? ACCOUNT_MANAGERS[selectedAm].name : null;
      if (editing && oldName !== name) {
        Object.keys(CLIENT_AM).forEach((c) => { if (CLIENT_AM[c] === oldName) CLIENT_AM[c] = name; });
      }
      // Assign the picked clients; any that belonged to someone else move to this account manager.
      const moved = [];
      picked.forEach((c) => {
        const prev = CLIENT_AM[c];
        if (prev && prev !== name) {
          moved.push(`${c} (from ${prev})`);
          const prevAm = ACCOUNT_MANAGERS.find((a) => a.name === prev);
          if (prevAm) prevAm.clients = Math.max(0, prevAm.clients - 1);
        }
        CLIENT_AM[c] = name;
      });
      const added = picked.filter((c) => !boxes.find((b) => b.value === c).hasAttribute('data-initial')).length;
      const movedText = moved.length ? ` Moved: ${moved.join(', ')}.` : '';

      if (editing) {
        const am = ACCOUNT_MANAGERS[selectedAm];
        Object.assign(am, { name, email, phone, status: formValue(form, 'Status') || am.status, clients: am.clients + added });
        flashMessage = { title: 'Changes saved', text: `${name}’s details were updated.${added ? ` ${added} client${added > 1 ? 's' : ''} added.` : ''}${movedText}` };
      } else {
        ACCOUNT_MANAGERS.push({ name, email, phone: phone || '—', clients: picked.length, vendors: 0, status: 'Invited', lastLogin: '—' });
        flashMessage = {
          title: 'Invite sent',
          text: `${name} was added as an account manager for ${picked.join(', ')}. An invite to set their password was emailed to ${email} (link valid 72 hours).${movedText}`
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
      if (rows.some((r) => r.period === period && r.client === m.client && r.ref !== '—' && r.status !== 'Rejected')) {
        showFieldError(form, 'Billing period', `${selectedMember} already has an active ${w2 ? 'timesheet' : 'invoice'} for ${m.client} in ${periodLong}.`);
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

  // Document Tracker: Remind / Request confirm on the same page (they used to jump to the dashboard).
  root.querySelectorAll('.doc-notify').forEach((btn) => {
    btn.addEventListener('click', () => {
      const d = DOCUMENTS[btn.dataset.doc];
      flashMessage = btn.dataset.kind === 'remind'
        ? { title: 'Reminder sent', text: `${d.owner} and their account manager were reminded to upload a new version of the ${d.name}.` }
        : { title: 'Request sent', text: `${d.owner} was asked to upload the ${d.name}.` };
      render();
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
        if (needsReassign) {
          const toName = cell.querySelector('.am-reassign').value;
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
      wrap.outerHTML = `<div class="doc-cell">${fileChip(file.name, fmtSize(file.size))}<button class="link-btn">View</button></div><span class="person-sub inline">Uploaded by you · just now</span>`;
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
    screen = { ...screen, alert: { tone: 'success', ...flashMessage } };
    flashMessage = null;
  }

  renderLeftNav(screen);
  renderPersonaButtons();
  renderUser();
  renderBreadcrumb(screen);

  pageTitle.textContent = screen.title;
  document.title = `${screen.title} · Arkhya Tech VMS`;
  screenContainer.innerHTML = screenMarkup(screen);
  screenContainer.onclick = handleTargetClick;
  wireFormControls(screenContainer);
  screenContainer.querySelectorAll('.tab[data-tab-index]').forEach((tab) => {
    tab.addEventListener('click', () => { activeTab = Number(tab.dataset.tabIndex); render(); });
  });

  breadcrumb.onclick = handleTargetClick;

  // Inline "Add holiday" input (browser prompt() dialogs are blocked in the hosted viewer).
  // PRD CL-5: at most 10 holidays per client; an 11th is blocked with a message.
  screenContainer.querySelectorAll('.chip-add').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const chipRow = button.closest('.chip-row');
      const field = chipRow.parentElement;
      const showLimit = (message) => {
        let note = field.querySelector('.chip-limit');
        if (!note) {
          note = document.createElement('div');
          note.className = 'chip-limit';
          field.appendChild(note);
        }
        note.textContent = message;
      };
      if (chipRow.querySelectorAll('.chip:not(.chip-add)').length >= 10) {
        showLimit('A client can have up to 10 holidays. Remove one to add another.');
        return;
      }
      if (chipRow.querySelector('.chip-input')) {
        chipRow.querySelector('.chip-input').focus();
        return;
      }
      const input = document.createElement('input');
      input.className = 'chip-input';
      input.id = 'newHolidayInput';
      input.placeholder = 'e.g. Dec 24 · Christmas Eve';
      chipRow.insertBefore(input, button);
      input.focus();
      const commit = () => {
        const value = input.value.trim();
        input.remove();
        if (!value) return;
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = value;
        const close = document.createElement('span');
        close.className = 'chip-x';
        close.textContent = '×';
        close.addEventListener('click', (e) => { e.stopPropagation(); chip.remove(); });
        chip.appendChild(close);
        chipRow.insertBefore(chip, button);
        const count = chipRow.querySelectorAll('.chip:not(.chip-add)').length;
        const hint = field.closest('.form-section')?.querySelector('.section-hint');
        if (hint) hint.textContent = `Select up to 10 holidays. ${count} of 10 selected.`;
      };
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') { input.value = ''; commit(); }
      });
      input.addEventListener('blur', commit);
    });
  });

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

render();
