import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Ghost, ShieldAlert, FileQuestion, CreditCard, Ban, ServerCrash, Construction, AlertTriangle, type LucideIcon } from 'lucide-react';

export type ErrorCode = 401 | 402 | 403 | 404 | 500 | 503;

interface ErrorPageProps {
  code?: ErrorCode | number;
  title?: string;
  message?: string;
  onAction?: () => void;
  actionLabel?: string;
}

const errorConfig: Record<number, { title: string; message: string; icon: LucideIcon }> = {
  400: {
    title: 'Bad Request',
    message: 'The server could not understand the request due to invalid syntax.',
    icon: FileQuestion,
  },
  401: {
    title: 'Unauthorized',
    message: 'You do not have permission to access this page.',
    icon: ShieldAlert,
  },
  402: {
    title: 'Payment Required',
    message: 'Payment is required to proceed with this request.',
    icon: CreditCard,
  },
  403: {
    title: 'Forbidden',
    message: 'Access to this resource is denied.',
    icon: Ban,
  },
  404: {
    title: 'Page Not Found',
    message: 'The page you are looking for might have been removed or is temporarily unavailable.',
    icon: Ghost,
  },
  500: {
    title: 'Internal Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    icon: ServerCrash,
  },
  503: {
    title: 'Service Unavailable',
    message: 'The service is currently unavailable. Please check back soon.',
    icon: Construction,
  },
};

const ErrorPage: React.FC<ErrorPageProps> = ({
  code: propCode,
  title: propTitle,
  message: propMessage,
  onAction,
  actionLabel = 'Go Home',
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Priorità: Props > Query Params > Default (404)
  const queryCode = searchParams.get('code');
  const code = propCode || (queryCode ? parseInt(queryCode, 10) : 404);

  const config = errorConfig[code] || {
    title: 'Error',
    message: 'An unexpected error occurred.',
    icon: AlertTriangle,
  };

  const title = propTitle || searchParams.get('title') || config.title;
  const message = propMessage || searchParams.get('message') || config.message;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50 text-gray-800 font-sans">
      <div className="max-w-lg">
        <div className="flex justify-center mb-6">
          <div className="p-6 bg-red-100 rounded-full shadow-sm">
            <Icon className="w-20 h-20 text-red-500" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="text-8xl font-extrabold text-red-500 m-0 leading-none">{code}</h1>
        <h2 className="text-4xl font-bold my-4">{title}</h2>
        <p className="text-lg text-gray-500 mb-8">{message}</p>
        <button
          onClick={onAction || (() => navigate('/'))}
          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors border-none cursor-pointer"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;