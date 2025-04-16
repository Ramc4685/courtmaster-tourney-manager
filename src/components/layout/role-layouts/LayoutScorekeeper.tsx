
import React from 'react';
import { Layout } from '../Layout';
import { LayoutProps } from '../RoleBasedLayout';

export const LayoutScorekeeper: React.FC<LayoutProps> = ({ children, permissions }) => {
  return (
    <Layout>
      {children}
    </Layout>
  );
};
