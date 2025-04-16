
import React from 'react';
import { Layout } from '../Layout';
import { LayoutProps } from '../RoleBasedLayout';

export const LayoutFrontDesk: React.FC<LayoutProps> = ({ children, permissions }) => {
  return (
    <Layout>
      {children}
    </Layout>
  );
};
