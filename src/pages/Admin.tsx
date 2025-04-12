import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

const AdminPage: React.FC = () => {
  return (
    <Layout>
      <AdminDashboard />
    </Layout>
  );
};

export default AdminPage;
