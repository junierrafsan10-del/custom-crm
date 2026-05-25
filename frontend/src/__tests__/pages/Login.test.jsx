import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

function renderLogin() {
  const onLoginSuccess = vi.fn();
  const view = render(<Login onLoginSuccess={onLoginSuccess} />);
  return { onLoginSuccess, view };
}

describe('Login Page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    renderLogin();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('shows error when submitting empty form', async () => {
    renderLogin();

    const form = document.querySelector('form');
    fireEvent.submit(form);

    await expect(screen.findByText('Please enter both username and password.')).resolves.toBeInTheDocument();
  });

  it('calls API on form submit', async () => {
    mockPost.mockResolvedValueOnce({
      success: true,
      user: { id: '1', username: 'testuser', role: 'Agent', name: 'Test User' }
    });

    const user = userEvent.setup();
    const { onLoginSuccess } = renderLogin();

    await user.type(screen.getByPlaceholderText('Enter username'), 'testuser');
    await user.type(screen.getByPlaceholderText('Enter password'), 'password123');
    const signInBtn = screen.getByRole('button', { name: /sign in/i });
    await user.click(signInBtn);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/users/login', {
        username: 'testuser',
        password: 'password123'
      });
    });
    expect(onLoginSuccess).toHaveBeenCalledWith({
      id: '1', username: 'testuser', role: 'Agent', name: 'Test User'
    });
  });

  it('shows error on failed login', async () => {
    mockPost.mockRejectedValueOnce(new Error('Invalid credentials'));

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText('Enter username'), 'testuser');
    await user.type(screen.getByPlaceholderText('Enter password'), 'wrong');
    const signInBtn = screen.getByRole('button', { name: /sign in/i });
    await user.click(signInBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('quick-fill buttons set credentials', async () => {
    const user = userEvent.setup();
    renderLogin();

    const buttons = screen.getAllByRole('button');
    const adminBtn = buttons.find(b => b.textContent.includes('Admin'));
    const agentBtn = buttons.find(b => b.textContent.includes('Agent'));
    expect(adminBtn).toBeTruthy();
    expect(agentBtn).toBeTruthy();

    await user.click(adminBtn);
    expect(screen.getByPlaceholderText('Enter username').value).toBe('admin');
    expect(screen.getByPlaceholderText('Enter password').value).toBe('admin123');

    await user.click(agentBtn);
    expect(screen.getByPlaceholderText('Enter username').value).toBe('agent');
    expect(screen.getByPlaceholderText('Enter password').value).toBe('agent123');
  });
});
