import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { PricingPlans } from '@/components/pricing/PricingPlans';

const PricingPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Pricing</h1>
        <PricingPlans />
      </div>
    </Layout>
  );
};

export default PricingPage;
