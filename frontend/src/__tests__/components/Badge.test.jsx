import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Badge from '../../components/ui/Badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders dot indicator when dot prop is true', () => {
    const { container } = render(<Badge dot>Online</Badge>);
    const dot = container.querySelector('span > span');
    expect(dot).toBeInTheDocument();
    expect(dot.className).toContain('rounded-full');
  });

  it('applies color classes', () => {
    render(<Badge color="error">Error</Badge>);
    const badge = screen.getByText('Error');
    expect(badge.className).toContain('text-error');
  });
});
