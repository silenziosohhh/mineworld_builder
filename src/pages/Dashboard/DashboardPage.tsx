import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useWorldStore } from '../../store/worldStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Plus, Box } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { blocks, resetWorld } = useWorldStore();
  const blocksCount = Object.keys(blocks).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link to="/builder">
          <Button onClick={() => resetWorld()}>
            <Plus className="h-4 w-4 mr-2" />
            New World
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Current Active World Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Box className="h-6 w-6 text-blue-600" />
            </div>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span>
          </div>
          <h3 className="text-xl font-bold mb-2">My Creative World</h3>
          <p className="text-gray-500 text-sm mb-4">
            {blocksCount} blocks placed • Last edited just now
          </p>
          <div className="flex gap-2">
            <Link to="/builder" className="w-full">
              <Button variant="secondary" className="w-full">Continue Building</Button>
            </Link>
          </div>
        </Card>

        {/* Placeholder for more worlds */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-8 text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer">
          <Plus className="h-12 w-12 mb-2" />
          <span className="font-medium">Create another world</span>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">User Stats</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Logged in as: <span className="font-bold text-gray-900">{user?.username}</span></p>
          <p className="text-gray-600">Account ID: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{user?.id}</span></p>
        </div>
      </div>
    </div>
  );
};
