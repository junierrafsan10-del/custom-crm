import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Modal from '../../components/ui/Modal';

describe('Modal', () => {
  it('renders when open', () => {
    render(<Modal isOpen={true} title="Test Modal"><p>Modal content</p></Modal>);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<Modal isOpen={false} title="Hidden"><p>Content</p></Modal>);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Closable"><p>Content</p></Modal>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalled();
  });
});
