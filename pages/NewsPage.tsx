import React from 'react';
import News from '../components/News';

const NewsPage: React.FC = () => {
  return (
    <div className="space-y-6 px-4 sm:px-0">
      <h2 className="text-2xl font-bold text-text-primary dark:text-white ml-1">Financial News</h2>
      <News />
    </div>
  );
};

export default NewsPage;
