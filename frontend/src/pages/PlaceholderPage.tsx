import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-3xl">
      <h1 className="text-xl sm:text-2xl font-bold text-surface-900 tracking-tight mb-6">{title}</h1>
      <div className="rounded-xl border border-surface-200 bg-white p-8 sm:p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-surface-100 flex items-center justify-center">
            <Construction size={24} className="text-surface-400" />
          </div>
        </div>
        <h3 className="text-base font-semibold text-surface-800">Coming soon</h3>
        <p className="mt-1.5 text-sm text-surface-500 max-w-sm mx-auto">{description}</p>
      </div>
    </div>
  );
}
