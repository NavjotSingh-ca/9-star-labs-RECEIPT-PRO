'use client';

import { FeatureLocked } from '@/components/FeatureLocked';

interface CommandPaletteProps {
  onAction: (action: string) => void;
}

export default function CommandPalette(_props: CommandPaletteProps) {
  return <FeatureLocked name="CommandPalette (NON-CORE)" />;
}
