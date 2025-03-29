
import React from "react";
import { Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const Public = () => {
  // This component will redirect to the public view
  // It exists to catch the /public route without parameters
  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Tournament Viewer</h1>
        <p className="mb-4">Please select a specific tournament to view.</p>
        <p className="text-gray-600">
          Use the URL format: /public/[tournament-id] to access a specific tournament.
        </p>
      </div>
    </Layout>
  );
};

export default Public;
