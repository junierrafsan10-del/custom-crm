import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  http.get('http://localhost:5001/api/leads', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { _id: '1', name: 'Lead A', phone: '+8801', stage: 'Intake', value: 50000, source: 'Facebook', followups: [], createdAt: new Date().toISOString() },
        { _id: '2', name: 'Lead B', phone: '+8802', stage: 'Interested', value: 30000, source: 'WhatsApp', followups: [{ title: 'Call back', dueDateTime: new Date(Date.now() + 86400000).toISOString(), notified: false }], createdAt: new Date().toISOString() }
      ]
    });
  }),

  http.get('http://localhost:5001/api/tasks', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { _id: '1', title: 'Task 1', desc: 'Description', priority: 'High', status: 'Open', assignee: 'User A', dueDate: '2026-06-01' },
        { _id: '2', title: 'Task 2', desc: 'Description', priority: 'Medium', status: 'In Progress', assignee: 'User B', dueDate: '2026-06-15' }
      ]
    });
  }),

  http.get('http://localhost:5001/api/customers', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { _id: '1', name: 'Customer A', phone: '+8801', email: 'a@test.com', platform: 'facebook', participantId: 'fb_1', createdAt: new Date().toISOString() },
        { _id: '2', name: 'Customer B', phone: '+8802', email: 'b@test.com', platform: 'whatsapp', participantId: 'wa_1', createdAt: new Date().toISOString() }
      ]
    });
  }),

  http.get('http://localhost:5001/api/messages', () => {
    return HttpResponse.json({
      success: true,
      conversations: [],
      messages: [],
      nextCursor: null
    });
  }),

  http.get('http://localhost:5001/api/users', () => {
    return HttpResponse.json({
      success: true,
      users: [
        { id: '1', username: 'admin', name: 'Admin', role: 'Admin' },
        { id: '2', username: 'agent', name: 'Agent', role: 'Agent' }
      ],
      nextCursor: null
    });
  })
];

export const server = setupServer(...handlers);
