import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api, ApiError, ComparisonResult } from '@/lib/api';
import { ErrorAlert } from '@/components/UI/ErrorAlert';
import { ChartSkeleton } from '@/components/UI/LoadingSkeleton';
import { exportComparisonCSV, downloadCSV } from '@/lib/export';
import { formatCurrency, formatDateForAPI } from '@/lib/utils/formatters';
import { BarChart3, Plus, X, Play, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Compare() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[] | null>(null);
  const [analysisResults, setAnalysisResults] = useState<Array<{
    symbol: string;
    success: boolean;
    metrics?: {
      avgSpan: number;
      maxSpan: number;
      totalDays: number;
    };
    error?: string;
  }> | null>(null);

  const addSymbol = () => {
    if (!newSymbol) return;
    const upperSymbol = newSymbol.toUpperCase();
    
    if (symbols.includes(upperSymbol)) {
      toast.error('Symbol already added');
      return;
    }
    
    if (symbols.length >= 5) {
      toast.error('Maximum 5 stocks can be compared');
      return;
    }

    setSymbols([...symbols, upperSymbol]);
    setNewSymbol('');
  };

  const removeSymbol = (symbol: string) => {
    setSymbols(symbols.filter(s => s !== symbol));
  };

  const setQuickDate = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setStartDate(formatDateForAPI(start));
    setEndDate(formatDateForAPI(end));
  };

  const handleCompare = async () => {
    if (symbols.length < 2) {
      toast.error('Add at least 2 stocks to compare');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Please select date range');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [historicalResult, analysisResult] = await Promise.all([
        api.compareHistorical(symbols, startDate, endDate),
        api.compareAnalyze(symbols, startDate, endDate),
      ]);

      setComparisonResults(historicalResult.results);
      setAnalysisResults(analysisResult.results);
      toast.success('Comparison completed');
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!comparisonResults) {
      toast.error('No comparison data to export');
      return;
    }

    try {
      const csvData = exportComparisonCSV(comparisonResults);
      downloadCSV(csvData, `stock_comparison_${Date.now()}.csv`);
      toast.success('Comparison exported successfully');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const prepareChartData = () => {
    if (!comparisonResults) return [];

    // Get all unique dates
    const allDates = new Set<string>();
    comparisonResults.forEach(r => {
      if (r.data) {
        r.data.forEach(d => allDates.add(d.date));
      }
    });

    const sortedDates = Array.from(allDates).sort();

    // Create chart data
    return sortedDates.map(date => {
      const dataPoint: { date: string; [key: string]: string | number | undefined } = { date };
      
      comparisonResults.forEach(r => {
        if (r.data) {
          const found = r.data.find(d => d.date === date);
          if (found) {
            dataPoint[r.symbol] = found.close;
          }
        }
      });

      return dataPoint;
    });
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {entry.name}: {formatCurrency(entry.value as number)}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compare Stocks</h1>
        <p className="text-muted-foreground mt-2">
          Side-by-side comparison of multiple stocks
        </p>
      </div>

      <div className="grid lg:grid-cols-[350px_1fr] gap-6">
        {/* Control Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newSymbol">Add Stock Symbol</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="newSymbol"
                    placeholder="e.g., AAPL"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && addSymbol()}
                  />
                  <Button onClick={addSymbol}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {symbols.length > 0 && (
                <div>
                  <Label>Selected Stocks ({symbols.length}/5)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {symbols.map((symbol) => (
                      <Badge key={symbol} variant="secondary" className="pr-1">
                        {symbol}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-2"
                          onClick={() => removeSymbol(symbol)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setQuickDate(30)}>
                  1M
                </Button>
                <Button size="sm" variant="outline" onClick={() => setQuickDate(90)}>
                  3M
                </Button>
                <Button size="sm" variant="outline" onClick={() => setQuickDate(180)}>
                  6M
                </Button>
                <Button size="sm" variant="outline" onClick={() => setQuickDate(365)}>
                  1Y
                </Button>
              </div>

              <Button
                className="w-full"
                onClick={handleCompare}
                disabled={loading || symbols.length < 2 || !startDate || !endDate}
              >
                <Play className="h-4 w-4 mr-2" />
                {loading ? 'Comparing...' : 'Compare Stocks'}
              </Button>

              {comparisonResults && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleExportCSV}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Area */}
        <div className="space-y-6">
          {error && <ErrorAlert error={error} onRetry={handleCompare} />}

          {loading && <ChartSkeleton />}

          {!loading && !error && comparisonResults && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Price Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={prepareChartData()}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        className="text-xs"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis className="text-xs" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {symbols.map((symbol, index) => (
                        <Line
                          key={symbol}
                          type="monotone"
                          dataKey={symbol}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {analysisResults && (
                <Card>
                  <CardHeader>
                    <CardTitle>Analysis Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {analysisResults.map((result) => (
                        <div
                          key={result.symbol}
                          className="rounded-lg border p-4"
                        >
                          <h3 className="font-medium mb-2">{result.symbol}</h3>
                          {result.success && result.metrics ? (
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Avg Span:</span>
                                <span className="font-medium">{result.metrics.avgSpan.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Max Span:</span>
                                <span className="font-medium">{result.metrics.maxSpan}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Days:</span>
                                <span className="font-medium">{result.metrics.totalDays}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-destructive">{result.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!loading && !error && !comparisonResults && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-primary/10 p-6 mb-4">
                  <BarChart3 className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Ready to Compare</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Add 2-5 stock symbols and select a date range to start comparison
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
