import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ED ATELIER
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">by enaam dirani</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {isAdmin && !isAdminPage && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="h-9 sm:h-10">
                  <Shield className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </Link>
            )}
            
            {user && (
              <Button onClick={signOut} variant="ghost" size="sm" className="h-9 sm:h-10">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
