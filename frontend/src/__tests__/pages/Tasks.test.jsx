import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPost, mockDel } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockDel: vi.fn()
}));

vi.mock('../../utils/api', () => ({
  get: mockGet,
  post: mockPost,
  put: vi.fn(),
  del: mockDel
}));

import Tasks from '../../pages/Tasks';

const mockTasks = [
  { _id: '1', title: 'Call client', desc: 'Follow up on proposal', priority: 'High', status: 'Open', assignee: 'User A', dueDate: '2026-06-01' },
  { _id: '2', title: 'Prepare report', desc: 'Monthly sales report', priority: 'Medium', status: 'In Progress', assignee: 'User B', dueDate: '2026-06-15' },
  { _id: '3', title: 'Review contract', desc: 'Legal review', priority: 'Low', status: 'Closed', assignee: 'User A', dueDate: '2026-05-20' }
];

describe('Tasks Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ success: true, data: mockTasks });
  });

  it('renders task list', async () => {
    render(<Tasks />);

    await waitFor(() => {
      expect(screen.getByText('Call client')).toBeInTheDocument();
      expect(screen.getByText('Prepare report')).toBeInTheDocument();
      expect(screen.getByText('Review contract')).toBeInTheDocument();
    });
  });

  it('shows status badges', async () => {
    render(<Tasks />);

    await waitFor(() => {
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Closed')).toBeInTheDocument();
    });
  });

  it('filters tasks by search', async () => {
    const user = userEvent.setup();
    render(<Tasks />);

    await waitFor(() => screen.getByText('Call client'));

    const searchInput = screen.getByPlaceholderText('Search tasks by title or assignee...');
    await user.type(searchInput, 'report');

    expect(screen.queryByText('Call client')).not.toBeInTheDocument();
    expect(screen.getByText('Prepare report')).toBeInTheDocument();
  });

  it('opens add task modal', async () => {
    const user = userEvent.setup();
    render(<Tasks />);

    await waitFor(() => screen.getByText('Call client'));
    await user.click(screen.getByText('Add Task'));

    expect(screen.getByText('Create New Task')).toBeInTheDocument();
  });

  it('creates a new task', async () => {
    mockPost.mockResolvedValueOnce({
      success: true,
      data: { _id: '4', title: 'New Task', desc: '', priority: 'Medium', status: 'Open', assignee: 'Support Member A', dueDate: '2026-07-01' }
    });

    const user = userEvent.setup();
    render(<Tasks />);

    await waitFor(() => screen.getByText('Call client'));

    await user.click(screen.getByText('Add Task'));

    await user.type(screen.getByPlaceholderText('e.g. Call back Tasnim Rahman'), 'New Task');

    const form = document.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({ title: 'New Task' }));
    });
  });

  it('deletes a task', async () => {
    mockDel.mockResolvedValueOnce({ success: true });

    const user = userEvent.setup();
    render(<Tasks />);

    await waitFor(() => screen.getByText('Call client'));

    const deleteButtons = screen.getAllByTitle('Delete task');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDel).toHaveBeenCalledWith('/api/tasks/1');
    });
  });

  it('shows priority badges', async () => {
    render(<Tasks />);

    await waitFor(() => {
      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getByText('Low Priority')).toBeInTheDocument();
    });
  });
});
