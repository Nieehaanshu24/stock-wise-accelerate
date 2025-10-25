import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RangeAnalysisResponse } from '@/lib/api';
import { formatCurrency, formatProcessingTime } from '@/lib/utils/formatters';
import { TrendingUp, TrendingDown, Activity, BarChart2 } from 'lucide-react';

interface RangeQueryResultsProps {
  data: RangeAnalysisResponse;
}

export function RangeQueryResults({ data }: RangeQueryResultsProps) {
  const { stats, range } = data;
  const priceRange = stats.max - stats.min;
  const volatility = Math.sqrt(stats.variance);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Range Query Results</CardTitle>
          <p className="text-sm text-muted-foreground">
            Days {range.start} to {range.end} • Processing time: {formatProcessingTime(data.processingTimeMs)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-green-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Maximum</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.max)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-red-500/10 p-3">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Minimum</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.min)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-blue-500/10 p-3">
                <BarChart2 className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.avg)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-purple-500/10 p-3">
                <Activity className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volatility</p>
                <p className="text-2xl font-bold">{volatility.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Price Range</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{formatCurrency(priceRange)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {((priceRange / stats.min) * 100).toFixed(2)}% of minimum price
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Variance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{stats.variance.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Standard deviation: {volatility.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
