'use client';

import { FeatureLocked } from '@/components/FeatureLocked';

interface InviteModalProps {
  onClose: () => void;
  businessUnits: { id: string; name: string }[];
}

export default function InviteModal(_props: InviteModalProps) {
  return <FeatureLocked name="InviteModal (NON-CORE)" />;
}
