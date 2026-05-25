import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Select from '../../components/ui/Select';

describe('Select', () => {
  const options = ['Option A', 'Option B', { value: 'custom', label: 'Custom Option' }];

  it('renders label and options', () => {
    render(<Select label="Choose" options={options} />);
    expect(screen.getByText('Choose')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Custom Option')).toBeInTheDocument();
  });

  it('renders placeholder', () => {
    render(<Select options={options} placeholder="Select an option" />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Select options={options} error="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });
});
