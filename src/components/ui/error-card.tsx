import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorCardProps {
    title: string;
    message: string;
    retryButton?: {
        onClick: () => void;
        text: string;
    };
    redirectButton?: {
        onClick: () => void;
        text: string;
    };
}

const ErrorCard = ({
    title,
    message,
    retryButton,
    redirectButton,
}: ErrorCardProps) => {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-md">
                <AlertTitle>{title}</AlertTitle>
                <AlertDescription className="mt-2">{message}</AlertDescription>

                <div className="mt-4 flex gap-2">
                    {retryButton && (
                        <Button variant="outline" onClick={retryButton.onClick}>
                            {retryButton.text}
                        </Button>
                    )}

                    {redirectButton && (
                        <Button
                            variant="default"
                            onClick={redirectButton.onClick}
                        >
                            {redirectButton.text}
                        </Button>
                    )}
                </div>
            </Alert>
        </div>
    );
};

export { ErrorCard };
