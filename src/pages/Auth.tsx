import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const AuthPage = ({ isAuthed }: { isAuthed: boolean }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthed) return <Navigate to="/" replace />;

  const submit = async () => {
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Signed in');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName || email.split('@')[0] } },
        });
        if (error) throw error;
        toast.success('Account created. Check your email if confirmation is enabled.');
      }
    } catch (e) {
      toast.error((e as Error).message || 'Auth failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Brand header */}
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.svg" alt="Agent Command Hub" className="w-20 h-20" />
          <div className="text-center">
            <h1 className="text-2xl font-bold font-heading text-foreground tracking-tight">
              Agent Command Hub
            </h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">
              Multi-Agent Orchestration Platform
            </p>
          </div>
        </div>

        {/* Auth card */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>

          <div className="space-y-3">
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {mode === 'signup' && (
              <Input placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            )}
          </div>

          <Button className="w-full" onClick={submit} disabled={loading || !email || !password}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </Button>

          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
