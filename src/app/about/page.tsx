"use client";
import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

export default function About() {
  const router = useRouter();
  const faqData = [
    {
      question: 'What is VandyClassConnect?',
      answer: 'VandyClassConnect is a platform designed for Vanderbilt students to review courses, find tutors, and upload/view syllabi.',
    },
    {
      question: 'How can I find a tutor?',
      answer: 'You can find tutors by searching for specific courses and checking tutor availability on the platform.',
    },
    {
      question: 'Can I leave course reviews?',
      answer: 'Yes, students can leave reviews for courses they have taken to help future students.',
    },
    {
      question: 'How do I upload a syllabus?',
      answer: 'Uploading a syllabus is easy. Just log in, navigate to the course, and add a review with the syllabus uploaded.',
    },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-3xl mx-auto mt-8 sm:mt-12">
        <div className="mb-4 sm:mb-8">
          <button
            className="text-white text-lg sm:text-xl hover:bg-gray-400 transition duration-300"
            onClick={() => router.back()}
          >
            ← Back
          </button>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-white">About</h1>

        {/* Intro Text */}
        <p className="text-center text-lg sm:text-xl mt-4 sm:mt-6 text-white leading-relaxed">
          VandyClassConnect is a platform to help Vanderbilt students
          navigate course registration. With VandyClassConnect, you can rate
          courses, leave comments, and upload syllabi to help your peers
          choose the best classes for their needs.
        </p>

        {/* FAQ Section */}
        <div className="mt-8 sm:mt-12">
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center sm:text-left">FAQ</h2>
          <div className="mt-4">
            {faqData.map((faq, index) => (
              <Disclosure key={index}>
                {({ open }) => (
                  <div className="mb-4 sm:mb-6">
                    <Disclosure.Button className="flex justify-between items-center w-full px-3 sm:px-4 py-2 text-sm sm:text-base font-medium text-left text-white bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
                      <span>{faq.question}</span>
                      {open ? (
                        <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> // Up arrow when expanded
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> // Down arrow when collapsed
                      )}
                    </Disclosure.Button>
                    <Disclosure.Panel className="px-3 sm:px-4 pt-4 pb-2 text-sm sm:text-base text-gray-200">
                      {faq.answer}
                    </Disclosure.Panel>
                  </div>
                )}
              </Disclosure>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}