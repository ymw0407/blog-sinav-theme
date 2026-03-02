import React from 'react';
import { applyResolvedTheme, readThemeMode, resolveTheme, writeThemeMode, type ThemeMode } from '../../app/theme/theme';
import { IconMoon, IconSun } from './icons';

export default function ThemeToggle() {
  const [mode, setMode] = React.useState<ThemeMode>(() => readThemeMode());

  React.useLayoutEffect(() => {
    applyResolvedTheme(resolveTheme(mode));
  }, [mode]);

  React.useEffect(() => {
    writeThemeMode(mode);
  }, [mode]);

  const label = mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button className="btn iconBtn" onClick={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))} aria-label={label} title={label}>
      {mode === 'dark' ? <IconMoon size={18} /> : <IconSun size={18} />}
    </button>
  );
}
