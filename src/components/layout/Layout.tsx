
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        {children || <Outlet />}
      </main>
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} CourtMaster Tournament Manager
        </div>
      </footer>
    </div>
  );
};

export default Layout;
