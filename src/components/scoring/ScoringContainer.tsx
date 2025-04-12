
import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Match } from '@/types/tournament';

interface ScoringContainerProps {
  children?: React.ReactNode;
  isLoading?: boolean;
  errorMessage?: string;
  match?: Match;
}

export const ScoringContainer: React.FC<ScoringContainerProps> = ({
  children,
  isLoading = false,
  errorMessage,
  match
}) => {
  return (
    <Layout>
      <div className="container mx-auto p-4">
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        
        {errorMessage && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            <p>{errorMessage}</p>
          </div>
        )}
        
        {!isLoading && !errorMessage && children}
      </div>
    </Layout>
  );
};

export default ScoringContainer;
