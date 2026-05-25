import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PageHeader from '../../components/ui/PageHeader';

describe('PageHeader', () => {
  it('renders title and description', () => {
    render(<PageHeader title="Dashboard" description="Overview of your data" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview of your data')).toBeInTheDocument();
  });
});
