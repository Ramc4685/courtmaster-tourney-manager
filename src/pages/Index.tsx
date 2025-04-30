import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Trophy, Clipboard, CalendarCheck, ChevronRight, Users, Award, Medal, Clock, Activity, Layout } from "lucide-react";
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/auth/AuthContext';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  items: string[];
  onClick: () => void;
  delay?: number;
}

interface StatsCardProps {
  icon: React.ElementType;
  value: string;
  label: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, items, onClick, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <Card className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-2">
        <motion.div 
          className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-2"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Icon className="h-6 w-6 text-primary" />
        </motion.div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-2">
        <ul className="list-disc list-inside text-sm space-y-1">
          {items.map((item, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: delay + 0.1 * index }}
            >
              {item}
            </motion.li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full group" 
          onClick={onClick}
        >
          <span className="group-hover:mr-4 transition-all">
            {title.split(' ')[0]}
          </span>
          <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  </motion.div>
);

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, value, label, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white rounded-lg p-4 shadow-md flex items-center space-x-4"
  >
    <div className="rounded-full bg-primary/10 p-3">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <div>
      <motion.div 
        className="text-2xl font-bold"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: delay + 0.2 }}
      >
        {value}
      </motion.div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  </motion.div>
);

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/tournaments');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Hero Section */}
      <motion.div 
        className="container mx-auto px-4 py-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 
          className="text-4xl md:text-6xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          CourtMaster
        </motion.h1>
        <motion.p 
          className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          The ultimate tournament management solution for indoor sports. 
          Streamline your tournaments from registration to awards ceremony.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-x-4"
        >
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="group"
          >
            {isAuthenticated ? 'View Tournaments' : 'Get Started'}
            <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
          </Button>
          {!isAuthenticated && (
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/login')}
              className="group"
            >
              Sign In
              <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </Button>
          )}
        </motion.div>
      </motion.div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard icon={Trophy} value="100+" label="Tournaments" delay={0.5} />
          <StatsCard icon={Users} value="1000+" label="Teams" delay={0.6} />
          <StatsCard icon={Activity} value="5000+" label="Matches" delay={0.7} />
          <StatsCard icon={Medal} value="20+" label="Categories" delay={0.8} />
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={Trophy}
            title="Tournament Management"
            description="Create and manage full tournaments with ease"
            items={[
              "Multiple tournament formats",
              "Automated bracket generation",
              "Real-time scoring updates",
              "Comprehensive tournament statistics"
            ]}
            onClick={() => navigate('/tournaments')}
            delay={0.9}
          />
          <FeatureCard
            icon={Layout}
            title="Court Management"
            description="Efficiently manage your court assignments"
            items={[
              "Smart court allocation",
              "Real-time court status",
              "Maintenance scheduling",
              "Utilization analytics"
            ]}
            onClick={() => navigate('/courts')}
            delay={1.0}
          />
          <FeatureCard
            icon={CalendarCheck}
            title="Match Scheduling"
            description="Streamline your tournament scheduling"
            items={[
              "Automated scheduling",
              "Conflict detection",
              "Break time management",
              "Schedule adjustments"
            ]}
            onClick={() => navigate('/schedule')}
            delay={1.1}
          />
        </div>
      </div>

      {/* CTA Section */}
      <motion.div 
        className="container mx-auto px-4 py-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        <div className="bg-primary/5 rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to streamline your tournaments?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of tournament organizers who trust CourtMaster 
            to run their events smoothly and efficiently.
          </p>
          <Button 
            size="lg" 
            variant="default"
            onClick={() => navigate('/tournaments/new')}
            className="group"
          >
            Create Your First Tournament
            <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;

