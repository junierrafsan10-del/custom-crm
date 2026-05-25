import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn()
}));

vi.mock('../../utils/api', () => ({
  get: vi.fn(),
  post: mockPost,
  put: vi.fn(),
  del: vi.fn()
}));

import Login from '../../pages/Login';

function renderAuthFlow() {
  const onLoginSuccess = vi.fn();
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={onLoginSuccess} />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('full login flow: fill form, submit, store user', async () => {
    const userData = { id: '1', username: 'admin', role: 'Admin', name: 'Admin User' };
    mockPost.mockResolvedValueOnce({ success: true, user: userData });

    const user = userEvent.setup();
    renderAuthFlow();

    await user.type(screen.getByPlaceholderText('Enter username'), 'admin');
    await user.type(screen.getByPlaceholderText('Enter password'), 'admin123');
    await user.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/users/login', {
        username: 'admin', password: 'admin123'
      });
      expect(localStorage.getItem('crm_user')).toBe(JSON.stringify(userData));
    });
  });

  it('handles network error gracefully', async () => {
    mockPost.mockRejectedValueOnce(new Error('Server connection failed.'));

    const user = userEvent.setup();
    renderAuthFlow();

    await user.type(screen.getByPlaceholderText('Enter username'), 'admin');
    await user.type(screen.getByPlaceholderText('Enter password'), 'admin123');
    await user.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByText('Server connection failed.')).toBeInTheDocument();
    });
  });
});
