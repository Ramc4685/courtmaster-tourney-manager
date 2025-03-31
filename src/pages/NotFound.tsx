
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

const NotFound = () => {
  const location = useLocation();
  const isLoginAttempt = location.pathname.toLowerCase() === "/login" || location.pathname.includes("login");

  React.useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // If the user is trying to access the login route, redirect them to the correct login page
  if (isLoginAttempt) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center py-16">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h1 className="text-4xl font-bold mb-4">Redirecting...</h1>
        <p className="text-xl text-gray-600 mb-4 text-center">
          Taking you to the login page
        </p>
        <Button asChild>
          <Link to="/login">
            Go to Login
          </Link>
        </Button>
      </div>
    );
  }

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
