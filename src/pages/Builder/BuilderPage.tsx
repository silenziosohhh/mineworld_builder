import React from 'react';
import { VoxelScene } from '../../components/builder/VoxelScene';

export const BuilderPage: React.FC = () => {
  return (
    <div className="relative w-full h-[calc(100vh-4rem)]">
      {/* 3D Scene */}
      <VoxelScene />
    </div>
  );
};