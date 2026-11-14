import { useState, type FormEvent } from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, TextField, Typography } from '@mui/material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch {
      setError('Ошибка входа!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card sx={{ width: '100%', maxWidth: 400, p: 2 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            Sign in
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              required
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              fullWidth
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={loading} fullWidth>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
