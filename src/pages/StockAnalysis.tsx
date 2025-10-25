import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, ApiError, SpanAnalysisResponse, RangeAnalysisResponse, WindowAnalysisResponse } from '@/lib/api';
import { ErrorAlert } from '@/components/UI/ErrorAlert';
import { ChartSkeleton } from '@/components/UI/LoadingSkeleton';
import { StockSpanResults } from '@/components/Analysis/StockSpanResults';
import { RangeQueryResults } from '@/components/Analysis/RangeQueryResults';
import { SlidingWindowResults } from '@/components/Analysis/SlidingWindowResults';
import { formatDateForAPI } from '@/lib/utils/formatters';
import { Play, Search } from 'lucide-react';

type AnalysisType = 'span' | 'range' | 'window';

export default function StockAnalysis() {
  const [symbol, setSymbol] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rangeStart, setRangeStart] = useState('0');
  const [rangeEnd, setRangeEnd] = useState('10');
  const [windowSize, setWindowSize] = useState('10');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [spanResults, setSpanResults] = useState<SpanAnalysisResponse | null>(null);
  const [rangeResults, setRangeResults] = useState<RangeAnalysisResponse | null>(null);
  const [windowResults, setWindowResults] = useState<WindowAnalysisResponse | null>(null);

  const [activeTab, setActiveTab] = useState<AnalysisType>('span');

  const handleAnalysis = async (type: AnalysisType) => {
    if (!symbol || !startDate || !endDate) {
      setError(new Error('Please fill in all required fields'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      switch (type) {
        case 'span':
          const spanData = await api.calculateSpan({
            symbol,
            startDate,
            endDate,
          });
          setSpanResults(spanData);
          break;

        case 'range':
          const rangeData = await api.analyzeRange({
            symbol,
            startDate,
            endDate,
            ql: parseInt(rangeStart),
            qr: parseInt(rangeEnd),
          });
          setRangeResults(rangeData);
          break;

        case 'window':
          const windowData = await api.analyzeWindow({
            symbol,
            startDate,
            endDate,
            windowSize: parseInt(windowSize),
          });
          setWindowResults(windowData);
          break;
      }
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  const setQuickDate = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setStartDate(formatDateForAPI(start));
    setEndDate(formatDateForAPI(end));
  };

  return (
    <div className="grid lg:grid-cols-[350px_1fr] gap-6 p-6 animate-fade-in">
      {/* Control Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Analysis Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="symbol">Stock Symbol</Label>
              <Input
                id="symbol"
                placeholder="e.g., AAPL, RELIANCE.NS"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use .NS suffix for NSE stocks
              </p>
            </div>

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
          </CardContent>
        </Card>

        {/* Analysis-specific parameters */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AnalysisType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="span">Span</TabsTrigger>
            <TabsTrigger value="range">Range</TabsTrigger>
            <TabsTrigger value="window">Window</TabsTrigger>
          </TabsList>

          <TabsContent value="range" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Range Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rangeStart">Start Index (ql)</Label>
                  <Input
                    id="rangeStart"
                    type="number"
                    min="0"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="rangeEnd">End Index (qr)</Label>
                  <Input
                    id="rangeEnd"
                    type="number"
                    min="0"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="window" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Window Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="windowSize">Window Size (days)</Label>
                <Input
                  id="windowSize"
                  type="number"
                  min="1"
                  max="1000"
                  value={windowSize}
                  onChange={(e) => setWindowSize(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of days in each sliding window
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button
          className="w-full"
          onClick={() => handleAnalysis(activeTab)}
          disabled={loading || !symbol || !startDate || !endDate}
        >
          <Play className="h-4 w-4 mr-2" />
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      {/* Results Area */}
      <div className="space-y-6">
        {error && <ErrorAlert error={error} onRetry={() => handleAnalysis(activeTab)} />}

        {loading && <ChartSkeleton />}

        {!loading && !error && (
          <>
            {activeTab === 'span' && spanResults && (
              <StockSpanResults data={spanResults} />
            )}
            {activeTab === 'range' && rangeResults && (
              <RangeQueryResults data={rangeResults} />
            )}
            {activeTab === 'window' && windowResults && (
              <SlidingWindowResults data={windowResults} />
            )}

            {!spanResults && !rangeResults && !windowResults && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="rounded-full bg-primary/10 p-6 mb-4">
                    <Play className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Configure your analysis parameters and click "Run Analysis" to see results
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
