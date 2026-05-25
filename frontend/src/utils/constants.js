export const LEAD_STAGES = ['Intake', 'Interested', 'Qualified', 'Converted', 'Lost'];

export const STAGE_COLORS = {
  Intake: '#3b82f6',
  Interested: '#8b5cf6',
  Qualified: '#10b981',
  Converted: '#059669',
  Lost: '#ef4444'
};

export const TASK_PRIORITIES = ['High', 'Medium', 'Low'];

export const TASK_STATUSES = ['Open', 'In Progress', 'Blocked', 'Closed'];

export const TASK_STATUS_COLORS = {
  Open: '#3b82f6',
  'In Progress': '#f59e0b',
  Blocked: '#ef4444',
  Closed: '#10b981'
};

export const CONVERSATION_STATUSES = ['New', 'Unpicked', 'Solved', 'Closed'];

export const CONVERSATION_STATUS_COLORS = {
  New: '#3b82f6',
  Unpicked: '#f59e0b',
  Solved: '#10b981',
  Closed: '#6b7280'
};

export const USER_ROLES = ['Admin', 'Agent'];

export const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/json'
];

export const POLLING_INTERVAL = 15000;

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/leads', label: 'Leads', icon: 'Users' },
  { path: '/tickets', label: 'Tickets', icon: 'Ticket' },
  { path: '/tasks', label: 'Tasks', icon: 'CheckSquare' },
  { path: '/users', label: 'Users', icon: 'UserCog' },
  { path: '/chat', label: 'Chat', icon: 'MessageSquare' },
  { path: '/settings', label: 'Settings', icon: 'Settings' }
];

export const PAGE_TITLES = {
  '/': 'Dashboard',
  '/leads': 'Leads',
  '/tickets': 'Tickets',
  '/tasks': 'Tasks',
  '/users': 'Users',
  '/chat': 'Chat',
  '/settings': 'Settings'
};

export const API_TIMEOUT = 15000;
