'use strict';
require('dotenv').config();

async function seed() {
  const { initDb } = require('./database');
  await initDb();

  const db = require('./database');
  const { runMigrations } = require('./migrations');
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  runMigrations();

  // Wipe existing data
  db.exec(`
    DELETE FROM audit_log;
    DELETE FROM application_status_history;
    DELETE FROM documents;
    DELETE FROM dependants;
    DELETE FROM applications;
    DELETE FROM refresh_tokens;
    DELETE FROM users;
    DELETE FROM products;
    DELETE FROM branches;
  `);

  // --- Branches ---
  const branchGauteng = { id: uuidv4(), name: 'Phuthaditjhaba Branch', region: 'Phuthas' };
  const branchWC = { id: uuidv4(), name: 'Bethlehem Branch', region: 'Bethlehem' };
  const branchKZN = { id: uuidv4(), name: 'Secunda Branch', region: 'Secunda' };

  [branchGauteng, branchWC, branchKZN].forEach(b => {
    db.run('INSERT INTO branches (id, name, region) VALUES (?, ?, ?)', [b.id, b.name, b.region]);
  });

  // --- Users ---
  const hash = (pw) => bcrypt.hashSync(pw, 12);

  const users = [
    { id: uuidv4(), email: 'thabo.mokoena@victory.demo', password_hash: hash('Agent@123'), first_name: 'Thabo', last_name: 'Mokoena', role: 'field_agent', branch_id: branchGauteng.id },
    { id: uuidv4(), email: 'zanele.dlamini@victory.demo', password_hash: hash('Agent@123'), first_name: 'Zanele', last_name: 'Dlamini', role: 'field_agent', branch_id: branchKZN.id },
    { id: uuidv4(), email: 'nomsa.khumalo@victory.demo', password_hash: hash('Agent@123'), first_name: 'Nomsa', last_name: 'Khumalo', role: 'field_agent', branch_id: branchWC.id },
    { id: uuidv4(), email: 'karabo@victory.demo', password_hash: hash('20260818'), first_name: 'Karabo', last_name: 'Agent', role: 'field_agent', branch_id: branchGauteng.id },
    { id: uuidv4(), email: 'sarah.vanderberg@victory.demo', password_hash: hash('Supervisor@123'), first_name: 'Sarah', last_name: 'van der Berg', role: 'supervisor', branch_id: branchGauteng.id },
    { id: uuidv4(), email: 'reuben@victory.demo', password_hash: hash('20260817'), first_name: 'Reuben', last_name: 'Supervisor', role: 'supervisor', branch_id: branchGauteng.id },
    { id: uuidv4(), email: 'admin@victory.demo', password_hash: hash('Admin@123'), first_name: 'System', last_name: 'Administrator', role: 'admin', branch_id: branchGauteng.id },
  ];

  users.forEach(u => {
    db.run(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.email, u.password_hash, u.first_name, u.last_name, u.role, u.branch_id]
    );
  });

  const [agentThabo, agentZanele, agentNomsa, agentKarabo, supervisorSarah, supervisorReuben, admin] = users;

  // --- Products ---
  const products = [
    {
      id: uuidv4(), name: 'Individual Cover',
      description: 'Comprehensive funeral cover for a single individual. Quick, simple and affordable.',
      monthly_premium: 89,
      benefits: JSON.stringify(['R15,000 funeral benefit','Accidental death double benefit','24-hour claims assistance','Nationwide funeral parlour network']),
      required_documents: JSON.stringify(['id_document','proof_of_address'])
    },
    {
      id: uuidv4(), name: 'Family Cover',
      description: 'One policy covers you, your spouse and up to 4 children under 21.',
      monthly_premium: 199,
      benefits: JSON.stringify(['R25,000 main member benefit','R15,000 spouse benefit','R10,000 per child (under 21)','Repatriation assistance','Grocery benefit (30 days)','24-hour claims assistance']),
      required_documents: JSON.stringify(['id_document','proof_of_address','supporting_document'])
    },
    {
      id: uuidv4(), name: 'Extended Family Cover',
      description: 'Extend your cover to include parents, in-laws, siblings and additional extended family members.',
      monthly_premium: 349,
      benefits: JSON.stringify(['R25,000 main member benefit','R15,000 spouse benefit','R10,000 per child (under 21)','R10,000 per parent/in-law','R7,500 extended members','Tombstone erection benefit','Repatriation assistance','Grocery benefit (30 days)','24-hour claims assistance']),
      required_documents: JSON.stringify(['id_document','proof_of_address','supporting_document'])
    },
  ];

  products.forEach(p => {
    db.run(
      `INSERT INTO products (id, name, description, monthly_premium, benefits, required_documents) VALUES (?, ?, ?, ?, ?, ?)`,
      [p.id, p.name, p.description, p.monthly_premium, p.benefits, p.required_documents]
    );
  });

  // --- Applications ---
  const makeRef = (num) => `APP-2026-${String(num).padStart(6, '0')}`;
  const n = v => (v === undefined ? null : v)
  const insertApp = (a) => db.run(
    `INSERT INTO applications (id, reference_number, agent_id, status, client_first_name, client_last_name,
     client_id_number, client_dob, client_mobile, client_email, client_address, preferred_language,
     product_id, consent_given, consent_timestamp, consent_agent_id, attribution_source, attribution_campaign,
     branch_id, submitted_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [a.id, a.ref, a.agent_id, a.status, n(a.fn), n(a.ln), n(a.id_num), n(a.dob), n(a.mobile), n(a.email),
     JSON.stringify(a.addr || {}), a.lang, n(a.product_id), a.consent ? 1 : 0,
     n(a.consent_ts), n(a.consent_agent), a.source, n(a.campaign),
     a.branch, n(a.submitted), a.created, a.updated]
  );

  const sampleApps = [
    { id: uuidv4(), ref: makeRef(1), agent_id: agentThabo.id, status: 'submitted', fn: 'Sipho', ln: 'Nkosi', id_num: '8503155234089', dob: '1985-03-15', mobile: '0712345678', email: 'sipho.nkosi@example.com', addr: { street: '12 Mabopane Road', suburb: 'Soshanguve', city: 'Pretoria', province: 'Gauteng', postal_code: '0152' }, lang: 'Zulu', product_id: products[1].id, consent: true, consent_ts: '2026-08-16T10:30:00.000Z', consent_agent: agentThabo.id, source: 'field_agent', branch: branchGauteng.id, submitted: '2026-08-16T10:35:00.000Z', created: '2026-08-16T09:00:00.000Z', updated: '2026-08-16T10:35:00.000Z' },
    { id: uuidv4(), ref: makeRef(2), agent_id: agentZanele.id, status: 'under_review', fn: 'Precious', ln: 'Zulu', id_num: '9206204567082', dob: '1992-06-20', mobile: '0823456789', addr: { street: '45 Umlazi Highway', suburb: 'Umlazi', city: 'Durban', province: 'KwaZulu-Natal', postal_code: '4031' }, lang: 'Zulu', product_id: products[2].id, consent: true, consent_ts: '2026-08-15T14:00:00.000Z', consent_agent: agentZanele.id, source: 'field_agent', branch: branchKZN.id, submitted: '2026-08-15T14:05:00.000Z', created: '2026-08-15T13:00:00.000Z', updated: '2026-08-15T14:05:00.000Z' },
    { id: uuidv4(), ref: makeRef(3), agent_id: agentThabo.id, status: 'requires_information', fn: 'Bongani', ln: 'Mthembu', id_num: '7812285432111', dob: '1978-12-28', mobile: '0734567890', addr: { street: '89 Tembisa Section', suburb: 'Tembisa', city: 'Johannesburg', province: 'Gauteng', postal_code: '1632' }, lang: 'Sotho', product_id: products[0].id, consent: true, consent_ts: '2026-08-14T09:20:00.000Z', consent_agent: agentThabo.id, source: 'whatsapp', campaign: 'August2026', branch: branchGauteng.id, submitted: '2026-08-14T09:25:00.000Z', created: '2026-08-14T08:30:00.000Z', updated: '2026-08-14T09:25:00.000Z' },
    { id: uuidv4(), ref: makeRef(4), agent_id: agentThabo.id, status: 'draft', fn: 'Lindiwe', ln: 'Shabalala', mobile: '0745678901', addr: {}, lang: 'English', consent: false, source: 'field_agent', branch: branchGauteng.id, created: '2026-08-17T08:00:00.000Z', updated: '2026-08-17T08:15:00.000Z' },
    { id: uuidv4(), ref: makeRef(5), agent_id: agentNomsa.id, status: 'approved', fn: 'Ayanda', ln: 'Botha', id_num: '0001014678094', dob: '2000-01-01', mobile: '0812345678', email: 'ayanda.botha@example.com', addr: { street: '23 Khayelitsha Road', suburb: 'Khayelitsha', city: 'Cape Town', province: 'Western Cape', postal_code: '7784' }, lang: 'Afrikaans', product_id: products[1].id, consent: true, consent_ts: '2026-08-13T11:00:00.000Z', consent_agent: agentNomsa.id, source: 'qr_campaign', campaign: 'Cape_Aug2026', branch: branchWC.id, submitted: '2026-08-13T11:05:00.000Z', created: '2026-08-13T10:00:00.000Z', updated: '2026-08-13T11:05:00.000Z' },
    { id: uuidv4(), ref: makeRef(6), agent_id: agentZanele.id, status: 'incomplete', fn: 'Thembi', ln: 'Mthethwa', id_num: '9510106543210', dob: '1995-10-10', mobile: '0656789012', addr: { street: '7 KwaMashu Road', suburb: 'KwaMashu', city: 'Durban', province: 'KwaZulu-Natal', postal_code: '4360' }, lang: 'Zulu', product_id: products[2].id, consent: false, source: 'facebook', campaign: 'FB_Funeral_July', branch: branchKZN.id, created: '2026-08-12T14:00:00.000Z', updated: '2026-08-12T14:30:00.000Z' },
    { id: uuidv4(), ref: makeRef(7), agent_id: agentNomsa.id, status: 'submitted', fn: 'Rorisang', ln: 'Motsepe', id_num: '8801034321098', dob: '1988-01-03', mobile: '0767890123', email: 'rorisang.m@example.com', addr: { street: '15 Gugulethu Avenue', suburb: 'Gugulethu', city: 'Cape Town', province: 'Western Cape', postal_code: '7750' }, lang: 'English', product_id: products[0].id, consent: true, consent_ts: '2026-08-17T07:30:00.000Z', consent_agent: agentNomsa.id, source: 'field_agent', branch: branchWC.id, submitted: '2026-08-17T07:35:00.000Z', created: '2026-08-17T07:00:00.000Z', updated: '2026-08-17T07:35:00.000Z' },
    { id: uuidv4(), ref: makeRef(8), agent_id: agentThabo.id, status: 'declined', fn: 'Kagiso', ln: 'Sithole', id_num: '6505155098765', dob: '1965-05-15', mobile: '0798901234', addr: { street: '56 Alex Township', suburb: 'Alexandra', city: 'Johannesburg', province: 'Gauteng', postal_code: '2090' }, lang: 'English', product_id: products[0].id, consent: true, consent_ts: '2026-08-10T10:00:00.000Z', consent_agent: agentThabo.id, source: 'referral', branch: branchGauteng.id, submitted: '2026-08-10T10:05:00.000Z', created: '2026-08-10T09:00:00.000Z', updated: '2026-08-10T10:05:00.000Z' },
  ];

  sampleApps.forEach(insertApp);

  // Dependants for app 1
  [
    { fn: 'Nandi', ln: 'Nkosi', rel: 'Spouse', id_num: '8812125432089', dob: '1988-12-12' },
    { fn: 'Lethiwe', ln: 'Nkosi', rel: 'Child', dob: '2015-05-20' },
  ].forEach(d => {
    db.run(
      `INSERT INTO dependants (id, application_id, first_name, last_name, relationship, id_number, dob, mobile, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), sampleApps[0].id, d.fn, d.ln, d.rel, d.id_num || null, d.dob || null, null, new Date().toISOString()]
    );
  });

  // Status history
  const addHistory = (appId, from, to, byId, note, ts) => {
    db.run(
      `INSERT INTO application_status_history (id, application_id, from_status, to_status, changed_by, note, changed_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), appId, from || null, to, byId, note || null, ts]
    );
  };

  addHistory(sampleApps[0].id, null, 'draft', agentThabo.id, 'Application created', '2026-08-16T09:00:00.000Z');
  addHistory(sampleApps[0].id, 'draft', 'submitted', agentThabo.id, 'Submitted by agent', '2026-08-16T10:35:00.000Z');
  addHistory(sampleApps[1].id, null, 'draft', agentZanele.id, null, '2026-08-15T13:00:00.000Z');
  addHistory(sampleApps[1].id, 'draft', 'submitted', agentZanele.id, 'Submitted', '2026-08-15T14:05:00.000Z');
  addHistory(sampleApps[1].id, 'submitted', 'under_review', supervisorSarah.id, 'Under review', '2026-08-15T16:00:00.000Z');
  addHistory(sampleApps[2].id, null, 'draft', agentThabo.id, null, '2026-08-14T08:30:00.000Z');
  addHistory(sampleApps[2].id, 'draft', 'submitted', agentThabo.id, 'Submitted', '2026-08-14T09:25:00.000Z');
  addHistory(sampleApps[2].id, 'submitted', 'requires_information', supervisorSarah.id, 'Proof of address unclear', '2026-08-14T15:00:00.000Z');
  addHistory(sampleApps[4].id, null, 'draft', agentNomsa.id, null, '2026-08-13T10:00:00.000Z');
  addHistory(sampleApps[4].id, 'draft', 'submitted', agentNomsa.id, 'Submitted', '2026-08-13T11:05:00.000Z');
  addHistory(sampleApps[4].id, 'submitted', 'under_review', supervisorSarah.id, null, '2026-08-13T14:00:00.000Z');
  addHistory(sampleApps[4].id, 'under_review', 'approved', supervisorSarah.id, 'All documents verified. Approved.', '2026-08-14T09:00:00.000Z');

  db.persist();

  console.log('\n✅ Database seeded successfully!\n');
  console.log('Demo credentials:');
  console.log('  Field Agent:  karabo@victory.demo  / 20260818');
  console.log('  Supervisor:   reuben@victory.demo / 20260817');
  console.log('  Field Agent:  thabo.mokoena@victory.demo  / Agent@123');
  console.log('  Field Agent:  zanele.dlamini@victory.demo / Agent@123');
  console.log('  Field Agent:  nomsa.khumalo@victory.demo  / Agent@123');
  console.log('  Supervisor:   sarah.vanderberg@victory.demo / Supervisor@123');
  console.log('  Admin:        admin@victory.demo / Admin@123\n');

  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
