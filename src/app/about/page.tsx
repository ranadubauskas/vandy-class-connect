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
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto mt-12">
        <div className="mb-8">
          <button
            className="text-white text-xl hover:bg-gray-400 transition duration-300"
            onClick={() => router.back()}
          >
            ← Back
          </button>
        </div>
        <h1 className="text-4xl font-bold text-center text-white">About</h1>
        <p className="text-center text-xl mt-4 text-white">
          VandyClassConnect is a platform to help Vanderbilt students
          navigate course registration. With VandyClassConnect, you can rate
          courses, leave comments, and upload syllabi to help your peers
          choose the best classes for their needs.
        </p>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white">FAQ</h2>
          <div className="mt-4">
            {faqData.map((faq, index) => (
                 <Disclosure key={index}>
                 {({ open }) => (
                   <div className="mb-6"> {/* Added margin for spacing between each Disclosure */}
                     <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-white bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
                       <span>{faq.question}</span>
                       {open ? (
                         <ChevronUpIcon className="w-5 h-5 text-white" /> // Show up arrow when expanded
                       ) : (
                         <ChevronDownIcon className="w-5 h-5 text-white" /> // Show down arrow when collapsed
                       )}
                     </Disclosure.Button>
                     <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-200">
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
