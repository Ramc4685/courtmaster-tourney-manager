
import React from 'react';
import { Tournament } from '@/types/tournament';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CategoryTabsProps {
  tournament: Tournament;
  activeTab: string;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ tournament, activeTab }) => {
  const [category, setCategory] = React.useState('all');

  return (
    <Tabs value={category} onValueChange={setCategory}>
      <TabsList>
        <TabsTrigger value="all">All Categories</TabsTrigger>
        {tournament.categories.map((cat) => (
          <TabsTrigger key={cat.id} value={cat.id}>
            {cat.name}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {/* Tabs content comes here */}
      <TabsContent value="all">
        <p className="text-sm text-gray-500">
          Viewing all categories
        </p>
      </TabsContent>
      
      {tournament.categories.map((cat) => (
        <TabsContent key={cat.id} value={cat.id}>
          <p className="text-sm text-gray-500">
            Viewing {cat.name}
          </p>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default CategoryTabs;
