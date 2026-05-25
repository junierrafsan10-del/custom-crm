const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

function buildUser(overrides = {}) {
  return {
    username: overrides.username || 'testuser',
    password: bcrypt.hashSync('password123', 10),
    name: overrides.name || 'Test User',
    role: overrides.role || 'Agent',
    email: overrides.email || 'test@example.com',
    phone: overrides.phone || '+8801700000000',
    tokenVersion: 0,
    loginAttempts: 0,
    lockoutUntil: null,
    ...overrides
  };
}

function buildLead(overrides = {}) {
  return {
    name: overrides.name || 'John Doe',
    email: overrides.email || 'john@example.com',
    phone: overrides.phone || '+8801700000001',
    title: overrides.title || 'Interested in product',
    product: overrides.product || 'Premium Plan',
    stage: overrides.stage || 'Intake',
    source: overrides.source || 'Facebook',
    value: overrides.value || 50000,
    followups: overrides.followups || [],
    ...overrides
  };
}

function buildTask(overrides = {}) {
  return {
    title: overrides.title || 'Test Task',
    desc: overrides.desc || 'Task description',
    priority: overrides.priority || 'Medium',
    status: overrides.status || 'Open',
    dueDate: overrides.dueDate || '2026-06-01',
    assignee: overrides.assignee || null,
    ...overrides
  };
}

function buildConversation(overrides = {}) {
  return {
    ticketId: overrides.ticketId || 1001,
    participantName: overrides.participantName || 'John Doe',
    participantId: overrides.participantId || 'fb_12345',
    platform: overrides.platform || 'facebook',
    status: overrides.status || 'New',
    messages: overrides.messages || [],
    ...overrides
  };
}

function buildCustomer(overrides = {}) {
  return {
    name: overrides.name || 'Jane Smith',
    phone: overrides.phone || '+8801700000002',
    email: overrides.email || 'jane@example.com',
    notes: overrides.notes || '',
    ...overrides
  };
}

function buildNotification(overrides = {}) {
  return {
    title: overrides.title || 'Test Notification',
    desc: overrides.desc || 'Notification description',
    type: overrides.type || 'General',
    unread: true,
    ...overrides
  };
}

module.exports = {
  buildUser,
  buildLead,
  buildTask,
  buildConversation,
  buildCustomer,
  buildNotification
};
