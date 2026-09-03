import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse bg-slate-200/80 rounded-xl ${className}`} />;
};

export const ReportCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-44 w-full rounded-xl" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
};
