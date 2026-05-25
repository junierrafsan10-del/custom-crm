import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPost, mockPut, mockDel } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDel: vi.fn()
}));

vi.mock('../../utils/api', () => ({
  get: mockGet,
  post: mockPost,
  put: mockPut,
  del: mockDel
}));

import Leads from '../../pages/Leads';

const mockLeads = [
  { _id: '1', id: '1', name: 'Lead A', phone: '+8801', stage: 'Intake', value: '$50000', source: 'Facebook', email: 'a@test.com', createdAt: new Date().toISOString() },
  { _id: '2', id: '2', name: 'Lead B', phone: '+8802', stage: 'Qualified', value: '$30000', source: 'WhatsApp', email: 'b@test.com', createdAt: new Date().toISOString() },
  { _id: '3', id: '3', name: 'Lead C', phone: '+8803', stage: 'Converted', value: '$10000', source: 'Calling', email: 'c@test.com', createdAt: new Date().toISOString() },
  { _id: '4', id: '4', name: 'Lead D', phone: '+8804', stage: 'Lost', value: '$5000', source: 'Facebook', email: 'd@test.com', createdAt: new Date().toISOString() }
];

describe('Leads Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ success: true, data: mockLeads });
  });

  it('renders kanban pipeline columns', async () => {
    render(<Leads />);

    await waitFor(() => {
      expect(screen.getByText('Discovery')).toBeInTheDocument();
      expect(screen.getByText('Proposal')).toBeInTheDocument();
      expect(screen.getByText('Negotiation')).toBeInTheDocument();
      expect(screen.getByText('Closed Won')).toBeInTheDocument();
      expect(screen.getByText('Lost')).toBeInTheDocument();
    });
  });

  it('renders deal cards with names', async () => {
    render(<Leads />);

    await waitFor(() => {
      expect(screen.getByText('Lead A')).toBeInTheDocument();
      expect(screen.getByText('Lead B')).toBeInTheDocument();
      expect(screen.getByText('Lead D')).toBeInTheDocument();
    });
  });

  it('opens add deal modal', async () => {
    const user = userEvent.setup();
    render(<Leads />);

    await waitFor(() => screen.getByText('Deals Pipeline'));
    await user.click(screen.getByText('Add Deal'));

    expect(screen.getByText('Add New Deal')).toBeInTheDocument();
  });

  it('creates a new lead', async () => {
    mockPost.mockResolvedValueOnce({
      success: true,
      data: { _id: '5', name: 'New Lead', phone: '+8805', stage: 'Intake', value: '$0', source: 'Facebook' }
    });

    const user = userEvent.setup();
    render(<Leads />);

    await waitFor(() => screen.getByText('Deals Pipeline'));
    await user.click(screen.getByText('Add Deal'));

    await user.type(screen.getByPlaceholderText('e.g. John Doe'), 'New Lead');
    await user.type(screen.getByPlaceholderText('+88017...'), '+8805');
    await user.click(screen.getByText('Create Deal'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/leads', {
        name: 'New Lead', email: '', phone: '+8805', stage: 'Intake', source: 'Facebook', value: '$0'
      });
    });
  });

  it('moves a lead to next stage', async () => {
    mockPut.mockResolvedValueOnce({ success: true });

    const user = userEvent.setup();
    render(<Leads />);

    await waitFor(() => screen.getByText('Lead A'));

    const moveButtons = screen.getAllByTitle('Move to Proposal');
    await user.click(moveButtons[0]);

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/api/leads/1', { stage: 'Interested' });
    });
  });

  it('deletes a lead with confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockDel.mockResolvedValueOnce({ success: true });

    const user = userEvent.setup();
    render(<Leads />);

    await waitFor(() => screen.getByText('Lead D'));

    const deleteButtons = screen.getAllByTitle('Delete');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDel).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });
});
