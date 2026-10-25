import { HugeiconsIcon } from '@hugeicons/react';
import type { HugeiconsIconProps } from '@hugeicons/react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const iconVariants = cva('app-icon inline-flex shrink-0 items-center justify-center', {
  variants: {
    tone: { brand: 'icon-brand', high: 'icon-high', medium: 'icon-medium', low: 'icon-low' },
    size: { inline: 'icon-inline', feature: 'icon-feature', hero: 'icon-hero' },
  },
  defaultVariants: { tone: 'brand', size: 'feature' },
});

export function AppIcon({ icon, tone = 'brand', size = 'feature', label, className }: {
  icon: HugeiconsIconProps['icon'];
  tone?: 'brand' | 'high' | 'medium' | 'low';
  size?: 'inline' | 'feature' | 'hero';
  label?: string;
  className?: string;
}) {
  return <span className={cn(iconVariants({ tone, size }), className)}>
    <HugeiconsIcon icon={icon} size={size === 'inline' ? 22 : size === 'hero' ? 80 : 52}
      strokeWidth={1.5} aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined} aria-label={label} />
  </span>;
}
