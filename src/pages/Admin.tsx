
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/shared/PageHeader';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserManagement from '@/components/admin/UserManagement';
import TournamentManagement from '@/components/admin/TournamentManagement';
import SystemSettings from '@/components/admin/SystemSettings';

const AdminPage: React.FC = () => {
  return (
    <ProtectedRoute requiredRole="admin">
      <Layout>
        <div className="container mx-auto py-6">
          <PageHeader 
            title="Admin Dashboard" 
            description="Manage system settings and users" 
            icon={<Shield className="h-6 w-6 text-court-green" />}
          />
          
          <Tabs defaultValue="overview" className="mt-6">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <UserManagement />
              </div>
            </TabsContent>
            
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
            
            <TabsContent value="tournaments">
              <TournamentManagement />
            </TabsContent>
            
            <TabsContent value="settings">
              <SystemSettings />
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default AdminPage;
