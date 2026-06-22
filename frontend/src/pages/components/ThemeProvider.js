// frontend/src/pages/components/ThemeProvider.js
import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['light', 'dark', 'high-contrast'].includes(savedTheme)) {
      return savedTheme;
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [fontSize, setFontSize] = useState(() => {
    const savedSize = localStorage.getItem('fontSize');
    return savedSize || 'medium';
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Also apply theme to body for background
    document.body.style.backgroundColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--bg-primary') || '#f0f4f8';
    
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme || savedTheme === 'system') {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('high-contrast');
    else setTheme('light');
  };

  const setThemeDirect = (newTheme) => {
    if (['light', 'dark', 'high-contrast'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  const setFontSizeDirect = (size) => {
    if (['small', 'medium', 'large', 'x-large'].includes(size)) {
      setFontSize(size);
    }
  };

  const getFontSizeInPx = () => {
    const sizes = {
      small: '12px',
      medium: '14px',
      large: '16px',
      'x-large': '18px'
    };
    return sizes[fontSize] || '14px';
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      fontSize,
      toggleTheme,
      setTheme: setThemeDirect,
      setFontSize: setFontSizeDirect,
      getFontSizeInPx
    }}>
      {children}
    </ThemeContext.Provider>
  );
};