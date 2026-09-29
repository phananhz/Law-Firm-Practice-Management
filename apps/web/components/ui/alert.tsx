import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
}

export function Alert({ variant = 'info', title, children, className = '', ...props }: AlertProps) {
  const configs = {
    info: {
      container: 'bg-sky-50 border-sky-200 text-sky-900',
      icon: <Info className="h-5 w-5 text-sky-600 flex-shrink-0" />,
      titleColor: 'text-sky-900',
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />,
      titleColor: 'text-emerald-900',
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />,
      titleColor: 'text-amber-900',
    },
    error: {
      container: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />,
      titleColor: 'text-rose-900',
    },
  };

  const current = configs[variant];

  return (
    <div
      role="alert"
      className={`flex gap-3 p-4 rounded-md border text-sm ${current.container} ${className}`}
      {...props}
    >
      {current.icon}
      <div className="space-y-1">
        {title && <h5 className={`font-medium leading-none ${current.titleColor}`}>{title}</h5>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
}
