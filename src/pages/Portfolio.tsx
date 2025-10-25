import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { api, Portfolio as PortfolioType, ApiError } from '@/lib/api';
import { ErrorAlert } from '@/components/UI/ErrorAlert';
import { TableSkeleton } from '@/components/UI/LoadingSkeleton';
import { formatCurrency, formatDate, getRelativeTime } from '@/lib/utils/formatters';
import { Plus, Trash2, TrendingUp, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export default function Portfolio() {
  const [portfolios, setPortfolios] = useState<PortfolioType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addHoldingDialogOpen, setAddHoldingDialogOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);

  // Form states
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDesc, setNewPortfolioDesc] = useState('');
  const [holdingSymbol, setHoldingSymbol] = useState('');
  const [holdingQuantity, setHoldingQuantity] = useState('');
  const [holdingPrice, setHoldingPrice] = useState('');

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
    </div>
  );
}
