import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Elegance Rentals
            </h1>
          </Link>

          <div className="flex items-center space-x-4">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </Button>
              </Link>
            )}
            
            {user ? (
              <Button onClick={signOut} variant="ghost" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Admin Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
