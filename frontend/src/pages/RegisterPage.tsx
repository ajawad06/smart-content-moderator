import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage } from '../lib/api';
import { Alert, Button, Card, Field, Input } from '../components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
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
      await register(email, password);
      navigate('/submit');
    } catch (err) {
      setError(apiErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-1 text-sm text-slate-500">Start submitting images for moderation</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && <Alert>{error}</Alert>}
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Field label="Password" hint="At least 8 characters">
            <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </Field>
          <Button type="submit" loading={loading} className="w-full">Create account</Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-medium text-slate-900 hover:underline">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
