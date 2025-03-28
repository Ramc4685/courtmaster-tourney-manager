
import React from "react";
import { Link } from "react-router-dom";
import { Trophy, Users, Calendar, ArrowRight, Court } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { TournamentProvider } from "@/contexts/TournamentContext";

const Dashboard = () => {
  return (
    <TournamentProvider>
      <Layout>
        <div className="max-w-6xl mx-auto">
          <section className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-gray-800">
              CourtMaster Tournament Manager
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Create and manage badminton tournaments with ease. Real-time scoring, 
              court management, and customizable tournament formats.
            </p>
            <div className="mt-8">
              <Link to="/tournaments/create">
                <Button size="lg" className="bg-court-green hover:bg-court-green/90">
                  Create New Tournament
                </Button>
              </Link>
            </div>
          </section>

          <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Trophy className="h-10 w-10 text-court-green mb-2" />
                <CardTitle>Tournament Management</CardTitle>
                <CardDescription>
                  Create and customize tournaments with various formats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Set up single elimination, double elimination, round robin, or 
                  division-based tournaments with customizable progression rules.
                </p>
              </CardContent>
              <CardFooter>
                <Link to="/tournaments">
                  <Button variant="outline" className="w-full">
                    Manage Tournaments
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="h-10 w-10 text-court-green mb-2" />
                <CardTitle>Court Scheduling</CardTitle>
                <CardDescription>
                  Optimize court usage and scheduling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Manage multiple courts, schedule matches, and track court 
                  availability in real-time to maximize tournament efficiency.
                </p>
              </CardContent>
              <CardFooter>
                <Link to="/courts">
                  <Button variant="outline" className="w-full">
                    Manage Courts
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-court-green mb-2" />
                <CardTitle>Live Scoring</CardTitle>
                <CardDescription>
                  Real-time scores for players and spectators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Keep scores updated in real-time with a dedicated referee interface. 
                  Spectators can view live scores from any device.
                </p>
              </CardContent>
              <CardFooter>
                <Link to="/scoring">
                  <Button variant="outline" className="w-full">
                    Scoring System
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </section>

          <section className="bg-gradient-to-r from-court-blue to-court-blue/80 rounded-xl p-8 text-white mb-12">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:mr-6">
                <h2 className="text-2xl font-bold mb-2">Ready to start your tournament?</h2>
                <p className="text-white/90">
                  Create your first tournament in minutes and start managing matches right away.
                </p>
              </div>
              <Link to="/tournaments/create">
                <Button size="lg" className="bg-white text-court-blue hover:bg-white/90">
                  Get Started Now
                </Button>
              </Link>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-gray-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-court-green">1</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Create a Tournament</h3>
                <p className="text-gray-600">
                  Define your tournament format, add teams, and customize division progression rules.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-gray-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-court-green">2</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Set Up Courts</h3>
                <p className="text-gray-600">
                  Add available courts, assign matches, and optimize your tournament schedule.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-gray-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-court-green">3</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Manage Live Scoring</h3>
                <p className="text-gray-600">
                  Track scores in real-time with referee interfaces and public viewing options.
                </p>
              </div>
            </div>
          </section>
        </div>
      </Layout>
    </TournamentProvider>
  );
};

export default Dashboard;
