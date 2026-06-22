// frontend/src/pages/components/AccessibilityProvider.js
import React, { createContext, useState, useEffect, useContext } from 'react';

const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('highContrast') === 'true';
  });
  
  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('reducedMotion') === 'true';
  });
  
  const [focusOutline, setFocusOutline] = useState(() => {
    return localStorage.getItem('focusOutline') !== 'false';
  });

  useEffect(() => {
    if (highContrast) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
    } else {
      document.documentElement.removeAttribute('data-high-contrast');
    }
    localStorage.setItem('highContrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
    localStorage.setItem('reducedMotion', reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    if (focusOutline) {
      document.documentElement.removeAttribute('data-disable-focus-outline');
    } else {
      document.documentElement.setAttribute('data-disable-focus-outline', 'true');
    }
    localStorage.setItem('focusOutline', focusOutline);
  }, [focusOutline]);

  return (
    <AccessibilityContext.Provider value={{
      highContrast,
      reducedMotion,
      focusOutline,
      setHighContrast,
      setReducedMotion,
      setFocusOutline
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};