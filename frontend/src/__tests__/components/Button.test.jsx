import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '../../components/ui/Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading spinner when loading', () => {
    const { container } = render(<Button loading>Loading</Button>);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<Button variant="danger">Delete</Button>);

    const btn = screen.getByRole('button', { name: 'Delete' });
    expect(btn.className).toContain('bg-error/10');
  });
});
