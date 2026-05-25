import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn()
}));

vi.mock('../../utils/api', () => ({
  get: mockGet,
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn()
}));

import Dashboard from '../../pages/Dashboard';

const mockLeads = [
  {
    _id: '1', name: 'Lead A', phone: '+8801', stage: 'Intake', value: 50000,
    source: 'Facebook', followups: [], createdAt: new Date().toISOString()
  },
  {
    _id: '2', name: 'Lead B', phone: '+8802', stage: 'Interested', value: 30000,
    source: 'WhatsApp',
    followups: [
      { title: 'Call back', dueDateTime: new Date(Date.now() + 86400000).toISOString(), notified: false }
    ],
    createdAt: new Date().toISOString()
  },
  {
    _id: '3', name: 'Lead C', phone: '+8803', stage: 'Lost', value: 10000,
    source: 'Calling', followups: [], createdAt: new Date().toISOString()
  }
];

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ success: true, data: mockLeads });
  });

  it('shows loading state initially', () => {
    renderDashboard();
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders metrics after loading', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Pipeline overview and pending follow-ups')).toBeInTheDocument();
      expect(screen.getByText('Pipeline Value')).toBeInTheDocument();
      expect(screen.getByText('Active Deals')).toBeInTheDocument();
      expect(screen.getByText('Avg Deal Value')).toBeInTheDocument();
    });
  });

  it('renders pipeline stages', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Discovery')).toBeInTheDocument();
      expect(screen.getByText('Proposal')).toBeInTheDocument();
      expect(screen.getByText('Closed Won')).toBeInTheDocument();
      expect(screen.getByText('Lost')).toBeInTheDocument();
    });
  });

  it('shows correct pipeline value calculation', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('$80k')).toBeInTheDocument();
    });
  });

  it('shows correct active deals count', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('renders follow-ups section', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Follow-ups')).toBeInTheDocument();
    });
  });
});
