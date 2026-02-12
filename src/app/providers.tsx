import React from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <React.StrictMode>
      {children}
    </React.StrictMode>
  );
};