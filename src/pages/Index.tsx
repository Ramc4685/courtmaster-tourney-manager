
import React from "react";
import { Link } from "react-router-dom";
import { Trophy, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

const Index = () => {
  console.log("Rendering Index page");
  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Welcome to TournamentPro</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The ultimate platform for managing badminton tournaments, scores, and brackets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 w-full max-w-4xl">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-court-green" />
              <h3 className="text-lg font-semibold mb-2">Create Tournaments</h3>
              <p className="text-gray-600">
                Easy setup with flexible formats and divisions
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-court-green" />
              <h3 className="text-lg font-semibold mb-2">Manage Teams</h3>
              <p className="text-gray-600">
                Add players and organize them into divisions
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-court-green" />
              <h3 className="text-lg font-semibold mb-2">Live Scoring</h3>
              <p className="text-gray-600">
                Real-time score updates across all devices
              </p>
            </div>
          </div>

          <Link to="/tournaments">
            <Button className="bg-court-green hover:bg-court-green/90 px-6 py-2 text-lg">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
