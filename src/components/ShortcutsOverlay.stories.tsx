import type { Meta, StoryObj } from '@storybook/nextjs';
import ShortcutsOverlay from './ShortcutsOverlay';
import { withProviders } from '../../.storybook/utils';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';
import { useState } from 'react';

function ShortcutsWithTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-8">
      <Button onClick={() => setOpen(!open)}>
        <Keyboard className="size-4 mr-2" />
        {open ? 'Close' : 'Open'} Shortcuts
      </Button>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-glass-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-glass-border px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <Keyboard className="h-4 w-4 text-champagne" />
                Keyboard Shortcuts
              </h2>
              <button type="button" onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-hover hover:text-text-primary" aria-label="Close">
                <span aria-hidden>✕</span>
              </button>
            </div>
            <div className="space-y-0.5 px-3 py-3">
              {[
                { keys: ['⌘K', 'Ctrl+K'], label: 'Command palette' },
                { keys: ['?'], label: 'Show this menu' },
                { keys: ['Escape'], label: 'Close overlays / modals' },
                { keys: ['⌘F', 'Ctrl+F'], label: 'Search receipts (AI semantic)' },
                { keys: ['S'], label: 'Open scanner' },
                { keys: ['A'], label: 'Approve selected receipt' },
                { keys: ['R'], label: 'Reject selected receipt' },
                { keys: ['←', '→'], label: 'Navigate tabs (swipe)' },
                { keys: ['⌘E', 'Ctrl+E'], label: 'Export data' },
              ].map((s) => (
                <div key={s.keys[0]} className="flex items-center justify-between rounded-lg px-3 py-2.5 transition hover:bg-surface-raised">
                  <span className="text-sm text-text-secondary">{s.label}</span>
                  <span className="flex items-center gap-1">
                    {s.keys.map((k, i) => (
                      <span key={k}>
                        <kbd className="inline-flex min-w-[24px] items-center justify-center rounded-md border border-glass-border bg-surface-raised px-1.5 py-0.5 text-[11px] font-semibold text-text-muted shadow-sm">{k}</kbd>
                        {i < s.keys.length - 1 && <span className="mx-1 text-text-muted">or</span>}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const meta: Meta<typeof ShortcutsOverlay> = {
  title: 'UI/ShortcutsOverlay',
  component: ShortcutsOverlay,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Keyboard shortcuts overlay. Triggered by pressing `?`. Lists all available keyboard shortcuts with platform-specific key labels.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ShortcutsOverlay>;

export const Default: Story = {};

export const WithTrigger: Story = {
  render: () => <ShortcutsWithTrigger />,
};
