const LEAD_STAGES = Object.freeze(['Intake', 'Interested', 'Qualified', 'Converted', 'Lost']);

const CONVERSATION_STATUSES = Object.freeze(['New', 'Picked', 'Solved', 'Closed']);

const TASK_PRIORITIES = Object.freeze(['High', 'Medium', 'Low']);

const TASK_STATUSES = Object.freeze(['Open', 'In Progress', 'Blocked', 'Closed']);

const USER_ROLES = Object.freeze(['Admin', 'Agent']);

const ALLOWED_MIME_TYPES = Object.freeze([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_EXTENSIONS = Object.freeze([
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf', '.txt', '.doc', '.docx',
]);

const DEFAULT_VALUES = Object.freeze({
  MAX_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCKOUT_MINUTES: 15,
  JWT_EXPIRY: '7d',
  PORT: 5000,
  BODY_LIMIT: '5mb',
  UPLOAD_MAX_BYTES: 5 * 1024 * 1024,
});

module.exports = {
  LEAD_STAGES,
  CONVERSATION_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  USER_ROLES,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  DEFAULT_VALUES,
};
