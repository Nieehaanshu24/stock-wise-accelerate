import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';
import { Activity, TrendingUp, Clock, Server } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [healthStatus, setHealthStatus] = useState<{
    status: string;
    uptime: number;
    environment: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const health = await api.healthCheck();
      setHealthStatus(health);
      setError(null);
    } catch (err) {
      setError('Unable to connect to backend service');
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          High-performance stock analysis powered by native C modules
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Backend Status
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthStatus ? (
                <span className="text-green-500">Online</span>
              ) : (
                <span className="text-red-500">Offline</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {healthStatus?.environment || 'Unknown'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Uptime
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthStatus ? formatUptime(healthStatus.uptime) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Server uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Analysis Engine
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Native C</div>
            <p className="text-xs text-muted-foreground mt-1">
              O(n) algorithms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Data Provider
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Yahoo Finance</div>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time data
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">1. Stock Analysis</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Analyze stock price trends with three powerful algorithms
              </p>
              <Button asChild>
                <Link to="/analysis">Start Analysis</Link>
              </Button>
            </div>

            <div>
              <h3 className="font-medium mb-2">2. Portfolio Management</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Track and manage your stock holdings
              </p>
              <Button asChild variant="outline">
                <Link to="/portfolio">View Portfolios</Link>
              </Button>
            </div>

            <div>
              <h3 className="font-medium mb-2">3. Compare Stocks</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Side-by-side comparison of multiple stocks
              </p>
              <Button asChild variant="outline">
                <Link to="/compare">Compare Stocks</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Stock Span Analysis</p>
                  <p className="text-sm text-muted-foreground">
                    Calculate consecutive days of price momentum
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Range Query (Segment Tree)</p>
                  <p className="text-sm text-muted-foreground">
                    Fast min/max/avg queries in O(log n) time
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Sliding Window Analysis</p>
                  <p className="text-sm text-muted-foreground">
                    Detect patterns: bullish, bearish, volatile, stable
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
