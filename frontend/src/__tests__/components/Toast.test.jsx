import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Toast from '../../components/ui/Toast';

describe('Toast', () => {
  it('renders message when show is true', () => {
    render(<Toast show={true} message="Operation successful" />);
    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('does not render when show is false', () => {
    render(<Toast show={false} message="Hidden" />);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('calls onDismiss when clicked', () => {
    const onDismiss = vi.fn();
    render(<Toast show={true} message="Dismiss me" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('Dismiss me'));
    expect(onDismiss).toHaveBeenCalled();
  });
});
