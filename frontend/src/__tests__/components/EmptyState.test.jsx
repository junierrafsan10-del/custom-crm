import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EmptyState from '../../components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="Nothing here" description="Add some items" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Add some items')).toBeInTheDocument();
  });

  it('renders action button and calls handler', () => {
    const handleAction = vi.fn();
    render(<EmptyState title="Empty" action={handleAction} actionLabel="Add Item" />);
    const btn = screen.getByText('Add Item');
    fireEvent.click(btn);
    expect(handleAction).toHaveBeenCalled();
  });
});
