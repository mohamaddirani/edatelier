import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { Instagram, Facebook, MessageCircle, Phone, MapPin } from 'lucide-react';

const emailSchema = z.string().email({ message: "Please enter a valid email address" });

export default function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      toast({
        title: "Invalid email",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('subscribers')
        .insert([{ email: email.trim() }]);

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already subscribed",
            description: "You're already on our mailing list!",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Successfully subscribed!",
          description: "You'll be notified about new dress arrivals.",
        });
        setEmail('');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-1 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ED ATELIER
            </h3>
            <p className="text-sm text-muted-foreground mb-4">by enaam dirani</p>
            <p className="text-muted-foreground mb-4">
              Discover exquisite designer dresses for every special occasion. 
              Your perfect dress awaits.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/enaamdirani.atelier"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary flex items-center justify-center transition-colors group"
              >
                <Instagram className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
              </a>
              <a
                href="https://facebook.com/EDAtelier"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary flex items-center justify-center transition-colors group"
              >
                <Facebook className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
              </a>
              <a
                href="https://api.whatsapp.com/send?phone=9613836748"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary flex items-center justify-center transition-colors group"
              >
                <MessageCircle className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3">
              <a
                href="tel:+9613836748"
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <Phone className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Call Us</p>
                  <p className="text-sm">+961 3836748</p>
                </div>
              </a>
              <a
                href="https://www.google.co.uk/maps/place/EDA+by+Enaam+Dirani/@33.3958084,35.3329162,17z/data=!3m1!4b1!4m6!3m5!1s0x151e8da843d290b9:0x6d9509e0d45138e0!8m2!3d33.3958084!4d35.3329162!16s%2Fg%2F11mkvyv7sn?entry=ttu&g_ep=EgoyMDI1MTExNi4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <MapPin className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Visit Us</p>
                  <p className="text-sm">View Location</p>
                </div>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Stay Updated</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to be notified about our newest dress arrivals.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ED ATELIER. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
