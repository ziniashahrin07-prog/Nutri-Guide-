import React from 'react';
import { FoodDatabase } from '../foodDatabase/FoodDatabase';

export const FoodDatabaseShowcase: React.FC = () => {
  return (
    <section id="food-database" className="bg-[#fdfcf8] border-y border-warm">
      <FoodDatabase isStandalonePage={false} />
    </section>
  );
};
