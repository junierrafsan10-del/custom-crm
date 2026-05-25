import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Card, { CardHeader } from '../../components/ui/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Card content</p></Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });
});

describe('CardHeader', () => {
  it('renders title and subtitle', () => {
    render(<CardHeader title="My Title" subtitle="My Subtitle" />);
    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByText('My Subtitle')).toBeInTheDocument();
  });

  it('renders action element', () => {
    render(<CardHeader title="Title" action={<button>Action</button>} />);
    expect(screen.getByText('Action')).toBeInTheDocument();
  });
});
