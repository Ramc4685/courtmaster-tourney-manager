import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Trophy, Clipboard, CalendarCheck, ChevronRight, Users, Award, Medal, Clock, Activity, Layout, Star, Shield } from "lucide-react";
import { motion, useScroll, useTransform } from 'framer-motion';
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
    whileHover={{ scale: 1.02 }}
    className="h-full"
  >
    <Card className="shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      <CardHeader className="pb-2">
        <motion.div 
          className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-2"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Icon className="h-6 w-6 text-primary" />
        </motion.div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-2 flex-grow">
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
    whileHover={{ scale: 1.05 }}
    className="bg-white rounded-lg p-4 shadow-md flex items-center space-x-4"
  >
    <motion.div 
      className="rounded-full bg-primary/10 p-3"
      whileHover={{ rotate: 360 }}
      transition={{ duration: 0.5 }}
    >
      <Icon className="h-6 w-6 text-primary" />
    </motion.div>
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
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

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
        className="container mx-auto px-4 py-16 text-center relative"
        style={{ opacity, scale }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 rounded-3xl transform -skew-y-6" />
        </motion.div>
        
        <motion.h1 
          className="text-4xl md:text-6xl font-bold mb-4 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          CourtMaster
          <motion.span
            className="absolute -top-4 -right-4 text-primary"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Star className="h-8 w-8" />
          </motion.span>
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
            className="group relative overflow-hidden"
          >
            <motion.span
              className="absolute inset-0 bg-primary/20"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5 }}
            />
            <span className="relative">
              {isAuthenticated ? 'View Tournaments' : 'Get Started'}
            </span>
            <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform relative" />
          </Button>
          
          {!isAuthenticated && (
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/login')}
              className="group relative overflow-hidden"
            >
              <motion.span
                className="absolute inset-0 bg-primary/10"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
              <span className="relative">Sign In</span>
              <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform relative" />
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
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to run successful tournaments
          </p>
        </motion.div>
        
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
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        <div className="bg-primary/5 rounded-2xl p-8 md:p-12 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10"
            initial={{ x: "-100%" }}
            whileInView={{ x: "100%" }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">Ready to streamline your tournaments?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of tournament organizers who trust CourtMaster 
              to run their events smoothly and efficiently.
            </p>
            <Button 
              size="lg" 
              variant="default"
              onClick={handleGetStarted}
              className="group relative overflow-hidden"
            >
              <motion.span
                className="absolute inset-0 bg-primary/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
              <span className="relative">
                {isAuthenticated ? 'View Tournaments' : 'Get Started Now'}
              </span>
              <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform relative" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Trust Indicators */}
      <motion.div 
        className="container mx-auto px-4 py-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            className="flex items-center justify-center text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div>
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
              <p className="text-muted-foreground">Built with enterprise-grade security and reliability in mind.</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-center justify-center text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div>
              <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-muted-foreground">Our dedicated team is always here to help you succeed.</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-center justify-center text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div>
              <Award className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Industry Leading</h3>
              <p className="text-muted-foreground">Trusted by top tournament organizers worldwide.</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;

