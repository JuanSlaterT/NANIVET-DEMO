'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PawPrint, Lock, Mail, AlertCircle } from 'lucide-react';

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      router.push('/admin');
    } else {
      setError('Email o contraseña incorrectos');
    }
  };

  const quickLogin = (em: string) => {
    setEmail(em);
    setPassword('nanivet123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-slate-950 to-cyan-950 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative bg-card/80 backdrop-blur-xl border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-24 h-auto">
            <img src="/logo.svg" alt="NANIVET Logo" className="w-full h-auto" />
          </div>
          <div>
            <CardDescription className="text-sm">Acceso al sistema</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@nanivet.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
