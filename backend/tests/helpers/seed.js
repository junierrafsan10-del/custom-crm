const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Lead = require('../../models/Lead');
const Task = require('../../models/Task');
const Conversation = require('../../models/Conversation');
const Customer = require('../../models/Customer');
const Notification = require('../../models/Notification');
const { buildUser, buildLead, buildTask, buildConversation, buildCustomer, buildNotification } = require('./factories');

async function seedUser(overrides = {}) {
  const data = buildUser(overrides);
  return User.create(data);
}

async function seedAdmin() {
  return seedUser({ username: 'admin', role: 'Admin', password: bcrypt.hashSync('admin123', 10) });
}

async function seedAgent() {
  return seedUser({ username: 'agent', role: 'Agent', password: bcrypt.hashSync('agent123', 10) });
}

async function seedUsers(count = 3) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(await seedUser({ username: `user${i}`, name: `User ${i}` }));
  }
  return users;
}

function getToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, tv: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function getAuthCookies(token) {
  return [`crm_token=${token}`];
}

async function seedLeads(count = 5) {
  const stages = ['Intake', 'Interested', 'Qualified', 'Converted', 'Lost'];
  const leads = [];
  for (let i = 0; i < count; i++) {
    leads.push(await Lead.create(buildLead({
      name: `Lead ${i}`,
      stage: stages[i % stages.length],
      value: (i + 1) * 10000
    })));
  }
  return leads;
}

async function seedTasks(count = 3) {
  const tasks = [];
  for (let i = 0; i < count; i++) {
    tasks.push(await Task.create(buildTask({ title: `Task ${i}` })));
  }
  return tasks;
}

async function seedConversation(overrides = {}) {
  const data = buildConversation(overrides);
  return Conversation.create(data);
}

async function seedCustomer(overrides = {}) {
  const data = buildCustomer(overrides);
  return Customer.create(data);
}

async function seedNotification(overrides = {}) {
  const data = buildNotification(overrides);
  return Notification.create(data);
}

module.exports = {
  seedUser,
  seedAdmin,
  seedAgent,
  seedUsers,
  getToken,
  getAuthCookies,
  seedLeads,
  seedTasks,
  seedConversation,
  seedCustomer,
  seedNotification
};
