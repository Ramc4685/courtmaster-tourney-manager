
import React from 'react';
import Layout from '@/components/layout/Layout';
import PricingPlans from '@/components/pricing/PricingPlans';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Pricing = () => {
  return (
    <Layout>
      <div className="bg-gradient-to-b from-background to-muted pb-16">
        <div className="container mx-auto py-12 px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl font-bold tracking-tight">Tournament Management Pricing</h1>
            <p className="mt-4 text-xl text-muted-foreground">
              Simple, transparent pricing for all your tournament needs
            </p>
            <div className="mt-6 flex justify-center space-x-4">
              <Link to="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
              <Button variant="default">Contact Sales</Button>
            </div>
          </div>
          
          <PricingPlans />
          
          <div className="mt-20 text-center">
            <h2 className="text-2xl font-semibold mb-4">Questions? We're here to help.</h2>
            <p className="text-muted-foreground mb-6">
              Our team is ready to answer any questions you may have about our tournament management solutions.
            </p>
            <Button className="mt-2">Contact Support</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Pricing;
