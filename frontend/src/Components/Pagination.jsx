import React from 'react';
import ReactPaginate from 'react-paginate';

export default function Pagination({ pageCount, onPageChange, forcePage }) {
  if (!pageCount || pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-center mt-6">
      <ReactPaginate
        pageCount={pageCount}
        pageRangeDisplayed={3}
        marginPagesDisplayed={1}
        onPageChange={onPageChange}
        containerClassName="flex gap-2"
        pageClassName="px-3 py-1 border rounded"
        activeClassName="bg-blue-600 text-white"
        previousLabel="< Previous"
        nextLabel="Next >"
        previousClassName="px-3 py-1 border rounded"
        nextClassName="px-3 py-1 border rounded"
        breakClassName="px-3 py-1"
        forcePage={forcePage}
      />
    </div>
  );
}
