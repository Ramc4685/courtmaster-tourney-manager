import React from 'react';
import HealthCheck from '@/components/health/HealthCheck';
import { MainLayout } from '@/components/layout/MainLayout';

const HealthPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <HealthCheck />
      </div>
    </MainLayout>
  );
};

export default HealthPage;
