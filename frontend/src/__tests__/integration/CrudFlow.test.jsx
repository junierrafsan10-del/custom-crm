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

describe('Leads CRUD Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and displays leads on mount', async () => {
    mockGet.mockResolvedValueOnce({
      success: true,
      data: [
        { _id: '1', id: '1', name: 'Test Lead', phone: '+8801', stage: 'Intake', value: '$10000', source: 'Facebook', email: 'test@test.com', createdAt: new Date().toISOString() }
      ]
    });

    render(<Leads />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/api/leads');
      expect(screen.getByText('Test Lead')).toBeInTheDocument();
    });
  });

  it('handles API failure on create gracefully', async () => {
    mockGet.mockResolvedValueOnce({ success: true, data: [] });
    mockPost.mockRejectedValueOnce(new Error('Could not reach backend.'));

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const user = userEvent.setup();
    render(<Leads />);

    await waitFor(() => screen.getByText('Deals Pipeline'));
    await user.click(screen.getByText('Add Deal'));

    await user.type(screen.getByPlaceholderText('e.g. John Doe'), 'Fail Lead');
    await user.type(screen.getByPlaceholderText('+88017...'), '+8800');
    await user.click(screen.getByText('Create Deal'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Could not reach backend.');
    });

    alertSpy.mockRestore();
  });
});
