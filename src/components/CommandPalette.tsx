'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@design/utils';
import { Input } from '@design/primitives/Input';
import { useKeyboardShortcut } from '@design/hooks';
import * as ReactDOM from 'react-dom';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  section: string;
  action: () => void;
  keywords?: string[];
  disabled?: boolean;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: CommandItem) => void;
  customCommands?: CommandItem[];
}

const DEFAULT_COMMANDS: CommandItem[] = [
  { id: 'nav-dashboard', label: 'Dashboard', description: 'Go to executive financial summary', icon: '📊', shortcut: '⌘D', section: 'Navigation', action: () => window.location.href = '/', keywords: ['home', 'overview', 'summary'] },
  { id: 'nav-receipts', label: 'Receipts', description: 'Browse all receipts', icon: '🧾', shortcut: '⌘R', section: 'Navigation', action: () => window.location.href = '/receipts', keywords: ['list', 'ledger', 'history'] },
  { id: 'nav-scan', label: 'Scan Receipt', description: 'Capture new receipt', icon: '📷', shortcut: '⌘S', section: 'Navigation', action: () => window.location.href = '/scan', keywords: ['camera', 'capture', 'ocr'] },
  { id: 'nav-mileage', label: 'Mileage', description: 'Track vehicle mileage', icon: '🛣️', shortcut: '⌘M', section: 'Navigation', action: () => window.location.href = '/mileage', keywords: ['vehicle', 'km', 'tracking'] },
  { id: 'nav-export', label: 'Export', description: 'Generate tax reports', icon: '📤', shortcut: '⌘E', section: 'Navigation', action: () => window.location.href = '/export', keywords: ['cra', 'pdf', 't2125'] },
  { id: 'nav-reconcile', label: 'Bank Reconciliation', description: 'Match bank transactions', icon: '🏦', shortcut: '⌘B', section: 'Navigation', action: () => window.location.href = '/reconcile', keywords: ['banking', 'match', 'transactions'] },
  { id: 'action-new-receipt', label: 'New Receipt', description: 'Create receipt manually', icon: '➕', shortcut: 'N', section: 'Actions', action: () => window.location.href = '/scan?mode=manual', keywords: ['create', 'add', 'manual'] },
  { id: 'action-bulk-approve', label: 'Bulk Approve', description: 'Approve multiple receipts', icon: '✅', shortcut: '⇧A', section: 'Actions', action: () => window.location.href = '/receipts?bulk=approve', keywords: ['batch', 'approve', 'multiple'] },
  { id: 'action-generate-report', label: 'Generate Report', description: 'Create new tax report', icon: '📄', shortcut: '⇧R', section: 'Actions', action: () => window.location.href = '/reports/generate', keywords: ['generate', 'create', 'tax'] },
  { id: 'settings-org', label: 'Organization Settings', description: 'Business info & policies', icon: '🏢', shortcut: '⌘O', section: 'Settings', action: () => window.location.href = '/settings/org', keywords: ['organization', 'business', 'policies'] },
  { id: 'settings-team', label: 'Team Members', description: 'Manage team access', icon: '👥', shortcut: '⌘T', section: 'Settings', action: () => window.location.href = '/settings/team', keywords: ['team', 'members', 'access'] },
  { id: 'settings-security', label: 'Security', description: 'MFA & sessions', icon: '🔒', shortcut: '⌘S', section: 'Settings', action: () => window.location.href = '/settings/security', keywords: ['mfa', 'two-factor', 'sessions'] },
  { id: 'help-shortcuts', label: 'Keyboard Shortcuts', description: 'View all shortcuts', icon: '⌨️', shortcut: '?', section: 'Help', action: () => window.location.href = '/shortcuts', keywords: ['keys', 'hotkeys', 'commands'] },
  { id: 'help-docs', label: 'Documentation', description: 'Read the docs', icon: '📚', shortcut: 'H', section: 'Help', action: () => window.open('/docs', '_blank'), keywords: ['docs', 'guide', 'manual'] },
];

function formatShortcut(shortcut: string): string {
  return shortcut
    .split(' ')
    .map(s => s.split('+').map(k => `<kbd class="px-1.5 py-0.5 text-[10px] font-mono bg-surface-raised border border-glass-border rounded">${k}</kbd>`).join('+'))
    .join(' ');
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: CommandItem) => void;
  customCommands?: CommandItem[];
}

function CommandItem({ cmd, isSelected, onCommand, onClose }: { 
  cmd: CommandItem; 
  isSelected: boolean; 
  onCommand: (cmd: CommandItem) => void; 
  onClose: () => void; 
}) {
  return (
    <button
      onClick={() => { onCommand(cmd); onClose(); }}
      disabled={cmd.disabled}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
        'hover:bg-surface-hover',
        isSelected && 'bg-champagne/5 outline-none ring-1 ring-champagne/30'
      )}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-text-secondary text-lg" aria-hidden="true">
        {cmd.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate">{cmd.label}</p>
        {cmd.description && <p className="text-sm text-text-muted truncate">{cmd.description}</p>}
      </div>
      {cmd.shortcut && (
        <span className="flex items-center gap-1 text-[10px] font-mono text-text-muted" dangerouslySetInnerHTML={{ __html: formatShortcut(cmd.shortcut) }} />
      )}
    </button>
  );
}

function SectionCommands({ section, commands, selectedIndex, flatCommands, onCommand, onClose, sectionIndex: _sectionIndex }: { 
  section: string; 
  commands: CommandItem[]; 
  selectedIndex: number; 
  flatCommands: CommandItem[]; 
  onCommand: (cmd: CommandItem) => void; 
  onClose: () => void;
  sectionIndex: number;
}) {
  return (
    <div className="border-b border-glass-border/50">
      <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted bg-surface/50">
        {section}
      </div>
      {commands.map((cmd, _cmdIndex) => {
        const flatIdx = flatCommands.indexOf(cmd);
        const isSelected = flatIdx === selectedIndex;
        return (
          <CommandItem
            key={cmd.id}
            cmd={cmd}
            isSelected={isSelected}
            onCommand={onCommand}
            onClose={onClose}
          />
        );
      })}
    </div>
  );
}

export function CommandPalette({ isOpen, onClose, onCommand, customCommands: _customCommands = [] }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useCallback((el: HTMLInputElement | null) => {
    if (el && isOpen) el.focus();
  }, [isOpen]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return DEFAULT_COMMANDS;
    const q = query.toLowerCase();
    return DEFAULT_COMMANDS.filter(cmd => 
      cmd.label.toLowerCase().includes(q) ||
      cmd.description?.toLowerCase().includes(q) ||
      cmd.keywords?.some(k => k.toLowerCase().includes(q)) ||
      cmd.section.toLowerCase().includes(q)
    );
  }, [query]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.section]) groups[cmd.section] = [];
      groups[cmd.section].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const sections = Object.keys(groupedCommands);
  const flatCommands = sections.flatMap(s => groupedCommands[s]);
  const totalCommands = flatCommands.length;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, totalCommands - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          onCommand(flatCommands[selectedIndex]);
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatCommands, selectedIndex, totalCommands, onClose, onCommand]);

  useKeyboardShortcut('k', () => {
    if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      onClose();
    }
  }, { meta: true, ctrl: true });

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.2, type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-1/4 left-1/2 z-[101] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 bg-surface-raised border border-glass-border rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="p-4 border-b border-glass-border">
          <div className="relative">
            <Input
              ref={inputRef}
              placeholder="Type a command or search…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              leftIcon={<svg className="h-5 w-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
              className="bg-surface border-glass-border text-text-primary placeholder:text-text-muted"
              aria-label="Command search"
              autoFocus
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-text-muted px-2 py-0.5 bg-surface-raised rounded">
              ⌘K
            </span>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {sections.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <svg className="mx-auto h-12 w-12 text-text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="mt-3 text-text-muted">No commands found</p>
              <p className="text-sm text-text-muted/70 mt-1">Try a different search term</p>
            </div>
          ) : (
            sections.map((section, sectionIndex) => (
              <SectionCommands
                key={section}
                section={section}
                commands={groupedCommands[section]}
                selectedIndex={selectedIndex}
                flatCommands={flatCommands}
                onCommand={onCommand}
                onClose={onClose}
                sectionIndex={sectionIndex}
              />
            ))
          )}
        </div>
        <div className="p-3 border-t border-glass-border bg-surface/50 flex items-center justify-between text-xs text-text-muted">
          <span>{totalCommands} command{totalCommands !== 1 ? 's' : ''} available</span>
          <span>⌘K to close • ↑↓ to navigate • ⏎ to select</span>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(o => !o),
  };
}