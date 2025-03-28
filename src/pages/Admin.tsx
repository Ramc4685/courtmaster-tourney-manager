
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/shared/PageHeader';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

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
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Total Users</CardTitle>
                    <CardDescription>Active registered users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">2</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Active Tournaments</CardTitle>
                    <CardDescription>Currently running tournaments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">0</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Total Matches</CardTitle>
                    <CardDescription>Matches played across all tournaments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">0</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage system users</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    User management will be implemented in a future update.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tournaments">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Management</CardTitle>
                  <CardDescription>View and manage all tournaments</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Tournament management will be implemented in a future update.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure global system settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    System settings will be implemented in a future update.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default AdminPage;
