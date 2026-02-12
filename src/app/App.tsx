import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

const App: React.FC = () => {
  const location = useLocation();
  // Hide footer in builder for fullscreen experience
  const isBuilder = location.pathname === '/builder';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      {!isBuilder && <Footer />}
    </div>
  );
};

export default App;