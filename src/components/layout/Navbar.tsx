
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, MenuIcon, Trophy, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTournament } from "@/contexts/TournamentContext";
import { useAuth } from "@/contexts/auth/AuthContext";
import UserMenu from "@/components/auth/UserMenu";
import AuthDialog from "@/components/auth/AuthDialog";

const Navbar: React.FC = () => {
  const { currentTournament } = useTournament();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Create conditionally rendered links based on whether there's a current tournament
  const scoringLink = currentTournament ? `/scoring/${currentTournament.id}` : "/tournaments";
  
  const handleTournamentClick = () => {
    if (currentTournament) {
      console.log("Navigating to current tournament:", currentTournament.id);
      navigate(`/tournament/${currentTournament.id}`);
    } else {
      navigate("/tournaments");
    }
  };

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
            {currentTournament && (
              <Button 
                variant="ghost" 
                className="text-gray-700 hover:text-court-green px-3 py-2 text-sm font-medium"
                onClick={handleTournamentClick}
              >
                Current Tournament
              </Button>
            )}
            <Link to={scoringLink} className="text-gray-700 hover:text-court-green px-3 py-2 text-sm font-medium">
              Scoring
            </Link>
            {currentTournament && (
              <Link to={`/share/${currentTournament.id}`} className="text-gray-700 hover:text-court-green px-3 py-2 text-sm font-medium">
                Public View
              </Link>
            )}
            {user && user.role === 'admin' && (
              <Link to="/admin" className="text-gray-700 hover:text-court-green px-3 py-2 text-sm font-medium">
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-2">
            {user ? (
              // Show user menu if logged in
              <UserMenu />
            ) : (
              // Show login button if not logged in
              <AuthDialog>
                <Button variant="outline" size="sm" className="hidden md:flex">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </AuthDialog>
            )}

            {/* Show profile link if logged in */}
            {user && (
              <Link to="/profile" className="hidden md:block">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Profile</span>
                </Button>
              </Link>
            )}

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
                  {currentTournament && (
                    <Button 
                      variant="ghost" 
                      className="justify-start text-lg font-medium p-0"
                      onClick={handleTournamentClick}
                    >
                      Current Tournament
                    </Button>
                  )}
                  <Link to={scoringLink} className="text-lg font-medium">
                    Scoring
                  </Link>
                  {currentTournament && (
                    <Link to={`/share/${currentTournament.id}`} className="text-lg font-medium">
                      Public View
                    </Link>
                  )}
                  
                  {user && user.role === 'admin' && (
                    <Link to="/admin" className="text-lg font-medium">
                      Admin
                    </Link>
                  )}
                  
                  {user ? (
                    <Link to="/profile" className="text-lg font-medium">
                      Profile
                    </Link>
                  ) : (
                    <AuthDialog>
                      <Button className="w-full">
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    </AuthDialog>
                  )}
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
