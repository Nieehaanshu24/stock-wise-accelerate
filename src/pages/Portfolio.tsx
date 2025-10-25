import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { api, Portfolio as PortfolioType, ApiError, BatchAnalysisResult } from '@/lib/api';
import { ErrorAlert } from '@/components/UI/ErrorAlert';
import { TableSkeleton } from '@/components/UI/LoadingSkeleton';
import { exportPortfolioToCSV, downloadCSV, parseCSVImport } from '@/lib/export';
import { formatCurrency, formatDate, getRelativeTime, formatDateForAPI } from '@/lib/utils/formatters';
import { Plus, Trash2, TrendingUp, Briefcase, Upload, Download, Play, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Portfolio() {
  const [portfolios, setPortfolios] = useState<PortfolioType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addHoldingDialogOpen, setAddHoldingDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [batchAnalysisDialogOpen, setBatchAnalysisDialogOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);
  const [batchAnalysisResults, setBatchAnalysisResults] = useState<BatchAnalysisResult[] | null>(null);
  const [batchAnalysisProgress, setBatchAnalysisProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form states
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDesc, setNewPortfolioDesc] = useState('');
  const [holdingSymbol, setHoldingSymbol] = useState('');
  const [holdingQuantity, setHoldingQuantity] = useState('');
  const [holdingPrice, setHoldingPrice] = useState('');
  const [analysisStartDate, setAnalysisStartDate] = useState('');
  const [analysisEndDate, setAnalysisEndDate] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    setLoading(true);
    try {
      const data = await api.getPortfolios();
      setPortfolios(data.portfolios);
      setError(null);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName) return;

    try {
      await api.createPortfolio({
        name: newPortfolioName,
        description: newPortfolioDesc,
      });
      toast.success('Portfolio created successfully');
      setNewPortfolioName('');
      setNewPortfolioDesc('');
      setCreateDialogOpen(false);
      loadPortfolios();
    } catch (err) {
      toast.error('Failed to create portfolio');
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    try {
      await api.deletePortfolio(id);
      toast.success('Portfolio deleted');
      loadPortfolios();
    } catch (err) {
      toast.error('Failed to delete portfolio');
    }
  };

  const handleAddHolding = async () => {
    if (!selectedPortfolio || !holdingSymbol || !holdingQuantity || !holdingPrice) return;

    try {
      await api.addHolding(selectedPortfolio, {
        symbol: holdingSymbol.toUpperCase(),
        quantity: parseFloat(holdingQuantity),
        averagePrice: parseFloat(holdingPrice),
      });
      toast.success('Holding added successfully');
      setHoldingSymbol('');
      setHoldingQuantity('');
      setHoldingPrice('');
      setAddHoldingDialogOpen(false);
      loadPortfolios();
    } catch (err) {
      toast.error('Failed to add holding');
    }
  };

  const handleRemoveHolding = async (portfolioId: string, symbol: string) => {
    try {
      await api.removeHolding(portfolioId, symbol);
      toast.success('Holding removed');
      loadPortfolios();
    } catch (err) {
      toast.error('Failed to remove holding');
    }
  };

  const handleExportCSV = (portfolio: PortfolioType) => {
    try {
      const csvData = exportPortfolioToCSV(portfolio);
      downloadCSV(csvData, `${portfolio.name.replace(/\s+/g, '_')}_${Date.now()}.csv`);
      toast.success('Portfolio exported successfully');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleImportCSV = async () => {
    if (!selectedPortfolio || !fileInputRef.current?.files?.[0]) return;

    const file = fileInputRef.current.files[0];

    try {
      await api.importPortfolioCSV(selectedPortfolio, file);
      toast.success('Holdings imported successfully');
      setImportDialogOpen(false);
      loadPortfolios();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      toast.error((err as ApiError).message);
    }
  };

  const handleBatchAnalysis = async () => {
    if (!selectedPortfolio || !analysisStartDate || !analysisEndDate) return;

    setIsAnalyzing(true);
    setBatchAnalysisProgress(0);
    setBatchAnalysisResults(null);

    try {
      const result = await api.batchAnalyzePortfolio(
        selectedPortfolio,
        analysisStartDate,
        analysisEndDate
      );

      setBatchAnalysisResults(result.results);
      setBatchAnalysisProgress(100);
      toast.success(`Analysis completed in ${(result.totalTimeMs / 1000).toFixed(2)}s`);
    } catch (err) {
      toast.error('Batch analysis failed');
      setError(err as ApiError);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const setQuickDate = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setAnalysisStartDate(formatDateForAPI(start));
    setAnalysisEndDate(formatDateForAPI(end));
  };

  const calculatePortfolioValue = (portfolio: PortfolioType) => {
    return portfolio.holdings.reduce(
      (total, holding) => total + holding.quantity * holding.averagePrice,
      0
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <TableSkeleton rows={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorAlert error={error} onRetry={loadPortfolios} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Management</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage your stock holdings
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Portfolio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Portfolio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Portfolio Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Long-term Investments"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description"
                  value={newPortfolioDesc}
                  onChange={(e) => setNewPortfolioDesc(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleCreatePortfolio} className="w-full">
                Create Portfolio
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {portfolios.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-6 mb-4">
              <Briefcase className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Portfolios Yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Create your first portfolio to start tracking your stock holdings
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Portfolio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{portfolio.name}</CardTitle>
                    {portfolio.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {portfolio.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePortfolio(portfolio.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(calculatePortfolioValue(portfolio))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {portfolio.holdings.length} holdings
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPortfolio(portfolio.id);
                        setImportDialogOpen(true);
                      }}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Import
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportCSV(portfolio)}
                      disabled={portfolio.holdings.length === 0}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedPortfolio(portfolio.id);
                        setAddHoldingDialogOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => {
                    setSelectedPortfolio(portfolio.id);
                    setBatchAnalysisDialogOpen(true);
                  }}
                  disabled={portfolio.holdings.length === 0}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Batch Analyze
                </Button>
              </CardHeader>
              <CardContent>
                {portfolio.holdings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No holdings yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {portfolio.holdings.map((holding) => (
                      <div
                        key={holding.symbol}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-primary/10 p-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{holding.symbol}</p>
                            <p className="text-xs text-muted-foreground">
                              {holding.quantity} shares @ {formatCurrency(holding.averagePrice)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(holding.quantity * holding.averagePrice)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveHolding(portfolio.id, holding.symbol)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-4">
                  Updated {getRelativeTime(portfolio.updatedAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Holding Dialog */}
      <Dialog open={addHoldingDialogOpen} onOpenChange={setAddHoldingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Holding</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="symbol">Stock Symbol</Label>
              <Input
                id="symbol"
                placeholder="e.g., AAPL"
                value={holdingSymbol}
                onChange={(e) => setHoldingSymbol(e.target.value.toUpperCase())}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.000001"
                placeholder="Number of shares"
                value={holdingQuantity}
                onChange={(e) => setHoldingQuantity(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="price">Average Price</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="Price per share"
                value={holdingPrice}
                onChange={(e) => setHoldingPrice(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleAddHolding} className="w-full">
              Add Holding
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Holdings from CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="csvFile">CSV File</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                ref={fileInputRef}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Format: symbol,quantity,averagePrice (one holding per line)
              </p>
            </div>
            <Button onClick={handleImportCSV} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Import Holdings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Analysis Dialog */}
      <Dialog open={batchAnalysisDialogOpen} onOpenChange={setBatchAnalysisDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Analyze Portfolio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="analysisStartDate">Start Date</Label>
                <Input
                  id="analysisStartDate"
                  type="date"
                  value={analysisStartDate}
                  onChange={(e) => setAnalysisStartDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="analysisEndDate">End Date</Label>
                <Input
                  id="analysisEndDate"
                  type="date"
                  value={analysisEndDate}
                  onChange={(e) => setAnalysisEndDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>
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
            </div>

            <Button
              onClick={handleBatchAnalysis}
              disabled={isAnalyzing || !analysisStartDate || !analysisEndDate}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'Analyzing...' : 'Start Batch Analysis'}
            </Button>

            {isAnalyzing && (
              <Progress value={batchAnalysisProgress} className="w-full" />
            )}

            {batchAnalysisResults && (
              <div className="space-y-2">
                <h3 className="font-medium">Analysis Results</h3>
                {batchAnalysisResults.map((result) => (
                  <div
                    key={result.symbol}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{result.symbol}</p>
                        {result.success && result.data ? (
                          <p className="text-xs text-muted-foreground">
                            Avg Span: {result.data.spanAvg.toFixed(2)} | 
                            Range: {formatCurrency(result.data.rangeStats.min)} - {formatCurrency(result.data.rangeStats.max)}
                          </p>
                        ) : (
                          <p className="text-xs text-destructive">{result.error}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {result.processingTimeMs}ms
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
