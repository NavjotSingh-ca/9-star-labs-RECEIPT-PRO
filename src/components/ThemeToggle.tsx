'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mounting
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-10 w-10 rounded-[2rem] bg-gray-100" />;
  }

  // TODO: Light mode theme requires full CSS variable redesign — locked to dark for now
  // This is now a dark mode indicator only, not a toggle
  return (
    <div
      className="relative h-10 w-10 flex items-center justify-center rounded-[2rem] bg-gray-800 text-gray-300"
      aria-label="Dark mode active"
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <Moon className="h-5 w-5" />
      </motion.div>
    </div>
  );
}
