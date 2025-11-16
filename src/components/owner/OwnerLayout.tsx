import { OwnerSidebar } from './OwnerSidebar';
import { OwnerTopbar } from './OwnerTopbar';

interface OwnerLayoutProps {
  children: React.ReactNode;
}

export const OwnerLayout = ({ children }: OwnerLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <OwnerSidebar />
      <div className="ml-64">
        <OwnerTopbar />
        <main className="pt-16 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

