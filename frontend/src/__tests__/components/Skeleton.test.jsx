import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Skeleton, { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders with default variant', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild;
    expect(el.className).toContain('animate-pulse');
  });
});

describe('SkeletonCard', () => {
  it('renders with correct number of lines', () => {
    const { container } = render(<SkeletonCard lines={3} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(4);
  });
});

describe('SkeletonTable', () => {
  it('renders with correct rows and cols', () => {
    const { container } = render(<SkeletonTable rows={2} cols={4} />);
    const rows = container.querySelectorAll('div > div');
    expect(rows.length).toBeGreaterThan(0);
  });
});
