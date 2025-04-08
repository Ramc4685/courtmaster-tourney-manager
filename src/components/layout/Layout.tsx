import React, { useEffect } from "react";
import { Navbar } from "./Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  useEffect(() => {
    console.log('Layout component mounted');
    return () => {
      console.log('Layout component unmounted');
    };
  }, []);

  console.log('Layout component rendering');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};