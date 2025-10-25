import { AlertCircle, WifiOff, ServerCrash } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';

interface ErrorAlertProps {
  error: ApiError | Error;
  onRetry?: () => void;
}

export function ErrorAlert({ error, onRetry }: ErrorAlertProps) {
  const isApiError = error instanceof ApiError;
  const isNetworkError = isApiError && error.statusCode === 0;
  const isServiceUnavailable = isApiError && error.statusCode === 503;

  const getIcon = () => {
    if (isNetworkError) return <WifiOff className="h-5 w-5" />;
    if (isServiceUnavailable) return <ServerCrash className="h-5 w-5" />;
    return <AlertCircle className="h-5 w-5" />;
  };

  const getTitle = () => {
    if (isNetworkError) return 'Connection Error';
    if (isServiceUnavailable) return 'Service Unavailable';
    return 'Error';
  };

  const getDescription = () => {
    if (isServiceUnavailable) {
      return (
        <div className="space-y-2">
          <p>{error.message}</p>
          <p className="text-sm text-muted-foreground">
            The backend service may not be configured properly. Please ensure:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
            <li>Backend server is running</li>
            <li>Data provider credentials are configured (if required)</li>
            <li>Native analysis modules are compiled</li>
          </ul>
        </div>
      );
    }

    return error.message;
  };

  return (
    <Alert variant="destructive" className="animate-fade-in">
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <AlertTitle>{getTitle()}</AlertTitle>
          <AlertDescription className="mt-2">
            {getDescription()}
          </AlertDescription>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-3"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}
