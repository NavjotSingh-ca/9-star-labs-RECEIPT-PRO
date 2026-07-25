/**
 * ApprovalBadge — Status badge for receipt approval workflow.
 */

import { forwardRef } from 'react';
import { cn } from '@design/utils/helpers';
import { Badge } from '@design/primitives/Badge';
import { Select } from '@design/primitives/Input';

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'draft'
  | 'needs_review'
  | 'flagged';

export interface ApprovalBadgeProps {
  status: ApprovalStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<ApprovalStatus, {
  label: string;
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'champagne';
  dotColor: string;
}> = {
  pending: {
    label: 'Pending',
    variant: 'warning',
    dotColor: '#F59E0B',
  },
  approved: {
    label: 'Approved',
    variant: 'success',
    dotColor: '#10B981',
  },
  rejected: {
    label: 'Rejected',
    variant: 'danger',
    dotColor: '#EF4444',
  },
  draft: {
    label: 'Draft',
    variant: 'default',
    dotColor: '#71717A',
  },
  needs_review: {
    label: 'Needs Review',
    variant: 'info',
    dotColor: '#3B82F6',
  },
  flagged: {
    label: 'Flagged',
    variant: 'danger',
    dotColor: '#EF4444',
  },
};

export function ApprovalBadge({
  status,
  size = 'md',
  showIcon = true,
  className,
}: ApprovalBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={showIcon}
      className={cn('capitalize', className)}
    >
      {config.label}
    </Badge>
  );
}

/**
 * ApprovalStatusDot — Just the colored dot indicator.
 */
export function ApprovalStatusDot({ status, size = 8 }: { status: ApprovalStatus; size?: number }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn('rounded-full flex-shrink-0')}
      style={{
        width: size,
        height: size,
        backgroundColor: config.dotColor,
      }}
      aria-label={config.label}
    />
  );
}

/**
 * ApprovalStatusSelect — Dropdown for changing approval status.
 */
export interface ApprovalStatusSelectProps {
  value: ApprovalStatus;
  onChange: (status: ApprovalStatus) => void;
  disabled?: boolean;
  className?: string;
}

export const ApprovalStatusSelect = forwardRef<HTMLSelectElement, ApprovalStatusSelectProps>(
  ({ value, onChange, disabled, className, ...props }, ref) => {
    const options: Array<{ value: ApprovalStatus; label: string }> = [
      { value: 'draft', label: 'Draft' },
      { value: 'pending', label: 'Pending' },
      { value: 'needs_review', label: 'Needs Review' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'flagged', label: 'Flagged' },
    ];

    return (
      <Select
        ref={ref}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value as ApprovalStatus)}
        disabled={disabled}
        className={cn('w-full', className)}
        options={options}
        {...props}
      />
    );
  }
);

ApprovalStatusSelect.displayName = 'ApprovalStatusSelect';

export default ApprovalBadge;