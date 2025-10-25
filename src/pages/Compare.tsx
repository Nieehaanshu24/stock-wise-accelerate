import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function Compare() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compare Stocks</h1>
        <p className="text-muted-foreground mt-2">
          Side-by-side comparison of multiple stocks
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-primary/10 p-6 mb-4">
            <BarChart3 className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Stock Comparison</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Compare multiple stocks side-by-side with analysis metrics. Feature coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
