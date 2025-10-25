import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WindowAnalysisResponse } from '@/lib/api';
import { formatCurrency, formatProcessingTime } from '@/lib/utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Minus } from 'lucide-react';

interface SlidingWindowResultsProps {
  data: WindowAnalysisResponse;
}

export function SlidingWindowResults({ data }: SlidingWindowResultsProps) {
  const chartData = data.windows.slice(0, 50).map((window) => ({
    index: window.index,
    max: window.max,
    min: window.min,
    avg: window.avg,
  }));

  const patternCounts = data.windows.reduce(
    (acc, window) => {
      acc[window.pattern] = (acc[window.pattern] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const getPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4" />;
      case 'bearish':
        return <TrendingDown className="h-4 w-4" />;
      case 'volatile':
        return <Activity className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'bullish':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'bearish':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'volatile':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="font-medium mb-2">Window {data.index}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-500">Max: {formatCurrency(data.max)}</p>
            <p className="text-blue-500">Avg: {formatCurrency(data.avg)}</p>
            <p className="text-red-500">Min: {formatCurrency(data.min)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(patternCounts).map(([pattern, count]) => (
          <Card key={pattern} className={getPatternColor(pattern)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium capitalize">
                  {pattern}
                </CardTitle>
                {getPatternIcon(pattern)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {((count / data.windows.length) * 100).toFixed(1)}% of windows
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sliding Window Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">
            Window size: {data.windowSize} days • {data.windows.length} total windows • Processing time: {formatProcessingTime(data.processingTimeMs)}
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="index"
                label={{ value: 'Window Index', position: 'insideBottom', offset: -5 }}
                className="text-xs"
              />
              <YAxis
                label={{ value: 'Price', angle: -90, position: 'insideLeft' }}
                className="text-xs"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="max" fill="hsl(var(--chart-1))" name="Max" />
              <Bar dataKey="avg" fill="hsl(var(--chart-2))" name="Avg" />
              <Bar dataKey="min" fill="hsl(var(--chart-3))" name="Min" />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6 max-h-[300px] overflow-y-auto">
            <div className="grid gap-2">
              {data.windows.slice(0, 20).map((window) => (
                <div
                  key={window.index}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-muted-foreground">
                      #{window.index}
                    </span>
                    <Badge variant="outline" className={getPatternColor(window.pattern)}>
                      {window.pattern}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {formatCurrency(window.min)} - {formatCurrency(window.max)}
                    </span>
                    <span className="font-medium">
                      Avg: {formatCurrency(window.avg)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {data.windows.length > 20 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Showing first 20 of {data.windows.length} windows
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
