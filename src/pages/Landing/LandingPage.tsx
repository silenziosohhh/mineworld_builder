import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Box, Layers, Share2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-extrabold mb-6">Build Your World, One Voxel at a Time</h1>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            The easiest way to create, share, and explore 3D voxel worlds directly in your browser. No download required.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">Start Building Free</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="ghost" className="text-white hover:bg-blue-700 hover:text-white border border-white">Login</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Box className="text-blue-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Easy Builder</h3>
            <p className="text-gray-600">Intuitive controls to place, remove and color blocks in a 3D space.</p>
          </div>
          <div className="text-center p-6">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Layers className="text-green-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Save Progress</h3>
            <p className="text-gray-600">Your worlds are saved automatically. Come back anytime to finish your masterpiece.</p>
          </div>
          <div className="text-center p-6">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="text-purple-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Share (Coming Soon)</h3>
            <p className="text-gray-600">Export your creations or share a link with friends to show off your work.</p>
          </div>
        </div>
      </section>
    </div>
  );
};