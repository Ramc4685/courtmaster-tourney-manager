
import React from "react";
import { Link } from "react-router-dom";
import { MenuIcon, Trophy, User, Settings } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTournament } from "@/contexts/TournamentContext";

const Navbar: React.FC = () => {
  const { currentTournament } = useTournament();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Trophy className="h-8 w-8 text-court-green mr-2" />
              <span className="text-xl font-bold text-gray-900">CourtMaster</span>
            </Link>
            {currentTournament && (
              <span className="ml-4 text-sm font-medium text-gray-500 hidden md:block">
                {currentTournament.name}
              </span>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-700 hover:text-court-green px-3 py-2 text-sm font-medium">
              Dashboard
            </Link>
            <Link to="/tournaments" className="text-gray-700 hover:text-court-green px-3 py-2 text-sm font-medium">
              Tournaments
            </Link>
            <Link to="/scoring" className="text-gray-700 hover:text-court-green px-3 py-2 text-sm font-medium">
              Scoring
            </Link>
            <Link to="/public" className="text-gray-700 hover:text-court-green px-3 py-2 text-sm font-medium">
              Public View
            </Link>
            <Link to="/admin" className="text-gray-700 hover:text-court-green px-3 py-2 text-sm font-medium">
              Admin
            </Link>
          </nav>

          <div className="flex items-center space-x-2">
            <Link to="/profile">
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Profile</span>
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
            </Link>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <MenuIcon className="h-6 w-6" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col space-y-4 mt-8">
                  <Link to="/" className="text-lg font-medium">
                    Dashboard
                  </Link>
                  <Link to="/tournaments" className="text-lg font-medium">
                    Tournaments
                  </Link>
                  <Link to="/scoring" className="text-lg font-medium">
                    Scoring
                  </Link>
                  <Link to="/public" className="text-lg font-medium">
                    Public View
                  </Link>
                  <Link to="/admin" className="text-lg font-medium">
                    Admin
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
