'use client';
import { useState } from 'react';

export default function CourseDetailPage() {
  const [reviews] = useState([
    {
      name: 'John Smith',
      rating: 4,
      comment:
        'Super easy and helpful class!',
    },
    {
      name: 'Jane Smith',
      rating: 4,
      comment:
        'Really hard class, I did not enjoy it at all and too much homework',
    },
  ]);
  const reviewsCount = 145;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-200 to-indigo-700 p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="text-3xl font-bold text-white">VandyClassConnect</div>
        <div className="flex space-x-4">
          <a href="#" className="text-white">Home</a>
          <a href="#" className="text-white">About</a>
          <a href="#" className="text-white">Resources</a>
          <a href="#" className="text-white">Profile</a>
        </div>
      </header>

      {/* Back to Search Link */}
      <div className="mb-8">
        <button
          className="text-white text-lg"
          onClick={() => window.location.href = '/home'}
        >
          ← Back to Search Page
        </button>
      </div>

      {/* Course Title and Download Syllabus */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-white text-3xl font-semibold">
          CS 4278: Principles of Software Engineering
        </h1>
        <button className="bg-white text-indigo-700 py-2 px-6 rounded-full shadow-lg">
          Download Syllabus
        </button>
      </div>

      {/* Reviews Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Reviews</h2>
          <div className="text-lg">
            <span className="font-semibold">{reviewsCount}</span> students reviewed this course
          </div>
        </div>
        <div className="text-gray-600 mb-4">{`Showing ${reviews.length} of ${reviewsCount}`}</div>

        {/* List of Reviews */}
        <div className="space-y-6">
          {reviews.map((review, index) => (
            <div key={index} className="flex items-start space-x-4">
              {/* Profile Picture Placeholder */}
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold">{review.name}</h3>
                  <span className="text-gray-500">{review.role}</span>
                </div>
                {/* Star Rating */}
                <div className="text-yellow-400 mb-2">
                  {'★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)}
                </div>
                <p className="text-gray-600">{review.comment}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
