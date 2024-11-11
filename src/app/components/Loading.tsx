import React from 'react';

export default function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start', // Align at the top
        minHeight: '100vh',
        paddingTop: '2rem', // Adds space from the top
      }}
    >
      <h1 className="text-4xl text-white">Loading...</h1>
    </div>
  );
}