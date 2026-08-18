'use strict';
const { v4: uuidv4 } = require('uuid');
const ApplicationRepository = require('../repositories/ApplicationRepository');
const DependantRepository = require('../repositories/DependantRepository');
const AuditService = require('./AuditService');
const UserRepository = require('../repositories/UserRepository');

function generateReference() {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `APP-${year}-${rand}`;
}

class ApplicationService {
  create({ agentId, attributionSource = 'field_agent' }) {
    const user = UserRepository.findById(agentId);
    const app = ApplicationRepository.create({
      id: uuidv4(),
      referenceNumber: generateReference(),
      agentId,
      branchId: user?.branch_id || null,
    });

    ApplicationRepository.addStatusHistory({
      id: uuidv4(),
      applicationId: app.id,
      fromStatus: null,
      toStatus: 'draft',
      changedBy: agentId,
      note: 'Application created',
    });

    if (attributionSource) {
      ApplicationRepository.update(app.id, { attribution_source: attributionSource });
    }

    AuditService.log({ userId: agentId, action: 'CREATE_APPLICATION', entityType: 'application', entityId: app.id });
    return this.getById(app.id, agentId);
  }

  getAll({ requestingUser, filters = {} }) {
    const query = { ...filters };
    if (requestingUser.role === 'field_agent') {
      query.agentId = requestingUser.id;
    }
    return ApplicationRepository.findAll(query);
  }

  getById(id, requestingUserId) {
    const app = ApplicationRepository.findById(id);
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });

    const requestingUser = UserRepository.findById(requestingUserId);
    if (requestingUser.role === 'field_agent' && app.agent_id !== requestingUserId) {
      throw Object.assign(new Error('Access denied'), { status: 403 });
    }

    return app;
  }

  update(id, fields, requestingUser) {
    const app = this.getById(id, requestingUser.id);

    if (app.status === 'submitted' && !['supervisor', 'admin'].includes(requestingUser.role)) {
      throw Object.assign(new Error('Cannot edit a submitted application'), { status: 409 });
    }

    const updated = ApplicationRepository.update(id, fields);
    AuditService.log({ userId: requestingUser.id, action: 'UPDATE_APPLICATION', entityType: 'application', entityId: id });
    return updated;
  }

  submit(id, requestingUser) {
    const app = this.getById(id, requestingUser.id);

    if (!['draft', 'incomplete', 'requires_information'].includes(app.status)) {
      throw Object.assign(new Error(`Cannot submit application with status '${app.status}'`), { status: 409 });
    }

    // Basic completeness check
    if (!app.client_first_name || !app.client_last_name || !app.client_mobile || !app.product_id) {
      throw Object.assign(new Error('Application is incomplete. Please fill in all required fields.'), { status: 422 });
    }

    if (!app.consent_given) {
      throw Object.assign(new Error('Client consent is required before submission'), { status: 422 });
    }

    const now = new Date().toISOString();
    ApplicationRepository.update(id, {
      status: 'submitted',
      submitted_at: now,
      consent_agent_id: requestingUser.id,
    });

    ApplicationRepository.addStatusHistory({
      id: uuidv4(),
      applicationId: id,
      fromStatus: app.status,
      toStatus: 'submitted',
      changedBy: requestingUser.id,
      note: 'Submitted by agent',
    });

    AuditService.log({ userId: requestingUser.id, action: 'SUBMIT_APPLICATION', entityType: 'application', entityId: id });
    return this.getById(id, requestingUser.id);
  }

  updateStatus(id, { toStatus, note }, requestingUser) {
    const allowed = ['submitted', 'under_review', 'requires_information', 'approved', 'declined'];
    if (!allowed.includes(toStatus)) {
      throw Object.assign(new Error('Invalid status'), { status: 400 });
    }

    const app = ApplicationRepository.findById(id);
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });

    ApplicationRepository.update(id, { status: toStatus });
    ApplicationRepository.addStatusHistory({
      id: uuidv4(),
      applicationId: id,
      fromStatus: app.status,
      toStatus,
      changedBy: requestingUser.id,
      note: note || null,
    });

    AuditService.log({
      userId: requestingUser.id,
      action: 'UPDATE_STATUS',
      entityType: 'application',
      entityId: id,
      metadata: { from: app.status, to: toStatus },
    });

    return ApplicationRepository.findById(id);
  }

  // Dependants
  getDependants(applicationId, requestingUser) {
    this.getById(applicationId, requestingUser.id);
    return DependantRepository.findByApplicationId(applicationId);
  }

  addDependant(applicationId, data, requestingUser) {
    this.getById(applicationId, requestingUser.id);
    const dep = DependantRepository.create({ id: uuidv4(), applicationId, ...data });
    AuditService.log({ userId: requestingUser.id, action: 'ADD_DEPENDANT', entityType: 'application', entityId: applicationId });
    return dep;
  }

  updateDependant(applicationId, dependantId, data, requestingUser) {
    this.getById(applicationId, requestingUser.id);
    const dep = DependantRepository.findById(dependantId);
    if (!dep || dep.application_id !== applicationId) throw Object.assign(new Error('Dependant not found'), { status: 404 });
    return DependantRepository.update(dependantId, data);
  }

  removeDependant(applicationId, dependantId, requestingUser) {
    this.getById(applicationId, requestingUser.id);
    const dep = DependantRepository.findById(dependantId);
    if (!dep || dep.application_id !== applicationId) throw Object.assign(new Error('Dependant not found'), { status: 404 });
    DependantRepository.delete(dependantId);
  }

  // Dashboard stats
  getStats(agentId = null) {
    return ApplicationRepository.countByStatus(agentId);
  }

  getSupervisorDashboard() {
    const statusCounts = ApplicationRepository.countByStatus();
    const agentStats = ApplicationRepository.getAgentStats();
    const dailyStats = ApplicationRepository.getDailyStats(14);
    return { statusCounts, agentStats, dailyStats };
  }
}

module.exports = new ApplicationService();
