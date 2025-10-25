import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpanAnalysisResponse } from '@/lib/api';
import { formatProcessingTime } from '@/lib/utils/formatters';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

interface StockSpanResultsProps {
  data: SpanAnalysisResponse;
}

export function StockSpanResults({ data }: StockSpanResultsProps) {
  const chartData = data.spans.map((span, index) => ({
    day: index + 1,
    span,
  }));

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="text-sm font-medium">Day {payload[0].payload.day}</p>
          <p className="text-sm text-muted-foreground">
            Span: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const maxSpan = Math.max(...data.spans);
  const avgSpan = (data.spans.reduce((a, b) => a + b, 0) / data.spans.length).toFixed(2);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.spans.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Max Span
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maxSpan}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Span
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSpan}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Span Visualization</CardTitle>
          <p className="text-sm text-muted-foreground">
            Processing time: {formatProcessingTime(data.processingTimeMs)}
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="day"
                label={{ value: 'Day', position: 'insideBottom', offset: -5 }}
                className="text-xs"
              />
              <YAxis
                label={{ value: 'Span', angle: -90, position: 'insideLeft' }}
                className="text-xs"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="span"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
