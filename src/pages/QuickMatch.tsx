
import React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import StandaloneMatchForm from "@/components/match/StandaloneMatchForm";

const QuickMatchPage: React.FC = () => {
  return (
    <div className="container py-6">
      <PageHeader 
        title="Quick Match Scoring" 
        description="Create a standalone match for immediate scoring without a tournament"
      />
      <div className="mt-6">
        <StandaloneMatchForm />
      </div>
    </div>
  );
};

export default QuickMatchPage;
