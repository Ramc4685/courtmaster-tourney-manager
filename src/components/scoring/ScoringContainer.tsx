
import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

interface ScoringContainerProps {
  children?: React.ReactNode;
  isLoading?: boolean;
  errorMessage?: string;
}

const ScoringContainer: React.FC<ScoringContainerProps> = ({ 
  children, 
  isLoading, 
  errorMessage 
}) => {
  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto py-8 px-4">
          <p>Loading tournament data...</p>
        </div>
      </Layout>
    );
  }

  if (errorMessage) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto py-8 px-4 text-center">
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">{errorMessage}</h2>
          <p className="text-gray-600 mb-6">
            Please select a tournament to access the scoring interface.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/tournaments">
              <Button>
                <Trophy className="mr-2 h-4 w-4" />
                Go to Tournaments
              </Button>
            </Link>
            <Link to="/quick-match">
              <Button variant="outline">
                Create Quick Match
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </Layout>
  );
};

export default ScoringContainer;
