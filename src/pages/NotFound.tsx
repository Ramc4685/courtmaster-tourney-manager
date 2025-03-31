
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

const NotFound = () => {
  const location = useLocation();

  React.useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="max-w-md mx-auto flex flex-col items-center justify-center py-16">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4 text-center">
          Oops! The page you're looking for doesn't exist
        </p>
        <Button asChild>
          <Link to="/">
            Return to Dashboard
          </Link>
        </Button>
      </div>
    </Layout>
  );
};

export default NotFound;
