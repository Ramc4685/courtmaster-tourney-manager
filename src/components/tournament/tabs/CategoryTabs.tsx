import React from 'react';
import { Tournament } from '@/types/tournament';

export interface CategoryTabsProps {
  tournament: Tournament;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ tournament }) => {
  return (
    <div>
      <h2>Categories</h2>
      {/* Implementation will go here */}
      {tournament.categories.map(category => (
        <div key={category.id} className="p-4 border rounded-md mb-2">
          <h3>{category.name}</h3>
        </div>
      ))}
    </div>
  );
};

export default CategoryTabs;
