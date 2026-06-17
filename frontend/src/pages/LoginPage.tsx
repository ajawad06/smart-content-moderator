import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage } from '../lib/api';
import { Alert, Button, Card, Field, Input } from '../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/submit');
    } catch (err) {
      setError(apiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">AI Content Moderation Platform</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && <Alert>{error}</Alert>}
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Field label="Password">
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          <Button type="submit" loading={loading} className="w-full">Sign in</Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          No account? <Link to="/register" className="font-medium text-slate-900 hover:underline">Create one</Link>
        </p>
      </Card>
    </div>
  );
}
