import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { carsApi } from '../services/carsApi';

const ITEMS_PER_PAGE = 35; // 7x5 сетка

const CarMarksGrid = () => {
  const [showAll, setShowAll] = useState(false);

  const { data: marksData, isLoading, error } = useQuery({
    queryKey: ['carMarks'],
    queryFn: carsApi.getMarks
  });

  if (isLoading) {
    return <div className="text-center">Загрузка...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Ошибка при загрузке марок</div>;
  }

  const marks = marksData?.data || [];
  const displayedMarks = showAll ? marks : marks.slice(0, ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-7 gap-4">
        {displayedMarks.map((mark) => (
          <Link
            key={mark.id}
            to={`/search?mark=${mark.id}`}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-center"
          >
            <div className="font-medium">{mark.name_rus}</div>
          </Link>
        ))}
      </div>
      
      {marks.length > ITEMS_PER_PAGE && !showAll && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(true)}
            className="btn btn-primary"
          >
            Показать все марки
          </button>
        </div>
      )}
    </div>
  );
};

export default CarMarksGrid;
 