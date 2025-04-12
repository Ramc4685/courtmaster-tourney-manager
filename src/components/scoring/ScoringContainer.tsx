import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { ScoringView } from './ScoringView';

export const ScoringContainer: React.FC = () => {
  return (
    <Layout>
      <ScoringView />
    </Layout>
  );
};
