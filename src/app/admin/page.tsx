"use client";
import { Tooltip, useMediaQuery } from "@mui/material";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaCheck, FaRegTrashAlt } from "react-icons/fa";
import { getUserCookies } from '../lib/functions';
import pb from "../lib/pocketbaseClient";

export default function Admin() {
  const [reports, setReports] = useState([]);
  const router = useRouter();

  // Detect if the screen width is less than 768px (small screens)
  const isSmallScreen = useMediaQuery('(max-width: 768px)');

  // Fetch all reported reviews with expanded review and reporter details
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await pb.collection('reviewReports').getList(1, 50, {
          expand: 'review,reporter,reviewCreator',
        });
        const validReports = response.items
          .filter((report) => report.expand?.review?.id)
          .sort((a, b) => (b.expand?.reporter?.length || 0) - (a.expand?.reporter?.length || 0));
        setReports(validReports);
      } catch (error) {
        console.error("Failed to fetch review reports:", error);
      }
    };
    fetchReports();
  }, []);

  useEffect(() => {
    const fetchCookies = async () => {
      try {
        const cookies = await getUserCookies();
        if (!cookies) {
          console.log("No user cookies found");
        }
      } catch (error) {
        console.error('Error fetching cookies:', error);
      }
    };
    fetchCookies();
  }, []);

  // Delete a review
  const deleteReview = async (reviewId) => {
    try {
      await pb.collection('reviews').delete(reviewId);
      setReports(reports.filter((report) => report.expand.review.id !== reviewId));
    } catch (error) {
      console.error("Failed to delete review:", error);
    }
  };

  // Approve a review report by deleting it from the reviewReports collection
  const approveReview = async (reportId) => {
    try {
      await pb.collection('reviewReports').delete(reportId);
      setReports(reports.filter((report) => report.id !== reportId));
    } catch (error) {
      console.error("Failed to approve review:", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-white mb-6 text-center">
        Admin Page - Reported Reviews
      </h1>

      {isSmallScreen ? (
        // **Render Cards on Small Screens**
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white p-4 rounded-lg shadow-md flex flex-col space-y-2"
            >
              <div className="flex justify-between">
                <h2 className="text-lg font-semibold">Report ID: {report.id}</h2>
                <div className="flex space-x-2">
                  <Tooltip title="Approve Review">
                    <button
                      aria-label="Approve Review"
                      data-testid="approve-button"
                      data-report-id={report.id}
                      onClick={() => approveReview(report.id)}
                      className="text-green-500 hover:text-green-700 transition duration-300"
                    >
                      <FaCheck className="text-xl" />
                    </button>
                  </Tooltip>
                  <Tooltip title="Delete Review">
                    <button
                      aria-label="Delete Review"
                      data-testid="delete-button"
                      data-review-id={report.expand.review.id}
                      onClick={() => deleteReview(report.expand.review.id)}
                      className="text-red-500 hover:text-red-700 transition duration-300"
                    >
                      <FaRegTrashAlt className="text-xl" />
                    </button>
                  </Tooltip>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Reported On:</strong>{" "}
                {new Date(report.created).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Review Content:</strong>{" "}
                {report.expand?.review?.comment || "No Comment"}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Review Rating:</strong>{" "}
                {report.expand?.review?.rating || "No Rating"}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Reviewer Name:</strong>{" "}
                {report.expand?.reviewCreator ? (
                  <Link href={`/profile/${report.expand.reviewCreator.id}`}>
                    <span className="font-semibold hover:text-blue-700 transform hover:scale-110 hover:underline transition-transform duration-200">
                      {`${report.expand.reviewCreator.firstName} ${report.expand.reviewCreator.lastName}`}
                    </span>
                  </Link>
                ) : "Anonymous"}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Reporter Names:</strong>{" "}
                {report.expand?.reporter && report.expand.reporter.length > 0
                  ? report.expand.reporter.map((rep) => (
                    <Link key={rep.id} href={`/profile/${rep.id}`}>
                      <span className="font-semibold hover:text-blue-700 transform hover:scale-110 hover:underline transition-transform duration-200">
                        {`${rep.firstName} ${rep.lastName}`}
                      </span>
                    </Link>
                  ))
                    .reduce((prev, curr) => [prev, ", ", curr])
                  : "Unknown"}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Report Count:</strong>{" "}
                {report.expand?.reporter?.length || 0}
              </p>
            </div>
          ))}
        </div>
      ) : (
        // **Render Table on Larger Screens**
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-lg">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4 border-b">Report ID</th>
                <th className="py-2 px-4 border-b">Reported On</th>
                <th className="py-2 px-4 border-b">Review Content</th>
                <th className="py-2 px-4 border-b">Review Rating</th>
                <th className="py-2 px-4 border-b">Reviewer Name</th>
                <th className="py-2 px-4 border-b">Reporter Names</th>
                <th className="py-2 px-4 border-b">Report Count</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b text-center">{report.id}</td>
                  <td className="py-2 px-4 border-b text-center">
                    {new Date(report.created).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    {report.expand?.review?.comment || "No Comment"}
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    {report.expand?.review?.rating || "No Rating"}
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    {report.expand?.reviewCreator ? (
                      <Link href={`/profile/${report.expand.reviewCreator.id}`}>
                        <span className="hover:text-blue-700 transform hover:scale-110 hover:underline transition-transform duration-200">
                          {`${report.expand.reviewCreator.firstName} ${report.expand.reviewCreator.lastName}`}
                        </span>
                      </Link>
                    ) : "Anonymous"}
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    {report.expand?.reporter && report.expand.reporter.length > 0
                      ? report.expand.reporter.map((rep) => (
                        <Link key={rep.id} href={`/profile/${rep.id}`}>
                          <span className="hover:text-blue-700 transform hover:scale-110 hover:underline transition-transform duration-200">
                            {`${rep.firstName} ${rep.lastName}`}
                          </span>
                        </Link>
                      ))
                        .reduce((prev, curr) => [prev, ", ", curr])
                      : "Unknown"}
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    {report.expand?.reporter?.length || 0}
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <Tooltip title="Approve Review">
                        <button
                          aria-label="Approve Review"
                          data-report-id={report.id}
                          data-testid="approve-button"
                          onClick={() => approveReview(report.id)}
                          className="text-green-500 hover:text-green-700 transition duration-300"
                        >
                          <FaCheck className="text-xl" />
                        </button>
                      </Tooltip>
                      <Tooltip title="Delete Review">
                        <button
                          aria-label="Delete Review"
                          data-testid="delete-button"
                          data-review-id={report.expand.review.id}
                          onClick={() => deleteReview(report.expand.review.id)}
                          className="text-red-500 hover:text-red-700 transition duration-300"
                        >
                          <FaRegTrashAlt className="text-xl" />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
