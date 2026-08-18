'use strict';
const db = require('../db/database');

class DependantRepository {
  findByApplicationId(applicationId) {
    return db.all(
      'SELECT * FROM dependants WHERE application_id = ? ORDER BY created_at ASC',
      [applicationId]
    );
  }

  findById(id) {
    return db.get('SELECT * FROM dependants WHERE id = ?', [id]);
  }

  create({ id, applicationId, firstName, lastName, relationship, idNumber, dob, mobile }) {
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO dependants (id, application_id, first_name, last_name, relationship, id_number, dob, mobile, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, applicationId, firstName, lastName, relationship, idNumber || null, dob || null, mobile || null, now]
    );
    db.persist();
    return this.findById(id);
  }

  update(id, { firstName, lastName, relationship, idNumber, dob, mobile }) {
    db.run(
      `UPDATE dependants SET first_name = ?, last_name = ?, relationship = ?,
       id_number = ?, dob = ?, mobile = ? WHERE id = ?`,
      [firstName, lastName, relationship, idNumber || null, dob || null, mobile || null, id]
    );
    db.persist();
    return this.findById(id);
  }

  delete(id) {
    db.run('DELETE FROM dependants WHERE id = ?', [id]);
    db.persist();
  }
}

module.exports = new DependantRepository();
