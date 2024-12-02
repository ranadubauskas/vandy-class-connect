'use client';

import Link from "next/link";
import { useContext, useState } from "react";
import RatingBox from '../../components/ratingBox';
import StarRating from "../../components/StarRating";
import { AuthContext } from "../../lib/contexts";
import pb from "../../lib/pocketbaseClient";
import { deleteReview } from "../../server";

export default function RatingCard({ rating, onDelete, onEdit }) {
  const NEXT_PUBLIC_POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
  const defaultProfilePic = '/images/user.png';
  const userVal = useContext(AuthContext);

  if (!userVal) return null;

  const user = rating.expand?.user;

  const [isEditing, setEditing] = useState(false);
  const [comment, setComment] = useState(rating.comment);
  const [starRating, setStarRating] = useState(rating.rating);
  const [wordCount, setWordCount] = useState(rating.comment ? rating.comment.split(' ').length : 0);
  const [errorMessage, setErrorMessage] = useState('');
  const [professorFirstName, setProfessorFirstName] = useState(
    rating.expand?.professors?.[0]?.firstName || ""
  );
  const [professorLastName, setProfessorLastName] = useState(
    rating.expand?.professors?.[0]?.lastName || ""
  );
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [syllabusUrl, setSyllabusUrl] = useState(
    rating.syllabus ? pb.files.getUrl(rating, rating.syllabus) : null
  );

  const handleSave = async () => {
    if (comment.split(/\s+/).length > 400) {
      setErrorMessage("Your comment exceeds the maximum word limit of 400 words.");
      return;
    }

    try {
      // Check if professor exists or create a new one
      const professorFirstNameTrimmed = professorFirstName.trim();
      const professorLastNameTrimmed = professorLastName.trim();

      let professorId;
      if (professorFirstNameTrimmed && professorLastNameTrimmed) {
        const professorFilter = `firstName="${professorFirstNameTrimmed}" && lastName="${professorLastNameTrimmed}"`;
        const existingProfessors = await pb.collection("professors").getFullList({
          filter: professorFilter,
          autoCancellation: false,
        });

        if (existingProfessors.length > 0) {
          professorId = existingProfessors[0].id;
        } else {
          const newProfessor = await pb.collection("professors").create({
            firstName: professorFirstNameTrimmed,
            lastName: professorLastNameTrimmed,
            course: rating.expand.course.id,
          });
          professorId = newProfessor.id;
        }
      }

      // Prepare the data for updating the review
      const formData = new FormData();
      formData.append('comment', comment);
      formData.append('rating', starRating);
      if (professorId) {
        formData.append('professors', professorId);
      }
      // Handle syllabus file upload
      if (syllabusFile) {
        formData.append('syllabus', syllabusFile);
      }

      // Make a single update call
      const updatedRecord = await pb.collection('reviews').update(rating.id, formData);

      // Update the syllabus URL if a new file was uploaded
      if (syllabusFile) {
        setSyllabusUrl(pb.files.getUrl(updatedRecord, updatedRecord.syllabus));
      }

      // Update the local state with new data
      const updatedReview = {
        ...rating,
        comment: updatedRecord.comment,
        rating: updatedRecord.rating,
        expand: {
          ...rating.expand,
          professors: professorId ? [{ id: professorId, firstName: professorFirstNameTrimmed, lastName: professorLastNameTrimmed }] : [],
        },
        syllabus: updatedRecord.syllabus,
      };

      setEditing(false);
      if (onEdit) onEdit(updatedReview);
    } catch (error) {
      console.error("Error saving review: ", error);
      setErrorMessage("Failed to save changes. Please try again.");
    }
  };

  const handleSyllabusChange = (e) => {
    setSyllabusFile(e.target.files[0]);
  };

  const handleCommentChange = (e) => {
    const newComment = e.target.value;
    const words = newComment.trim().split(/\s+/);
    if (words.length <= 400) {
      setComment(newComment);
      setWordCount(words.length);
      setErrorMessage('');
    } else {
      setErrorMessage('Your comment exceeds the maximum word limit of 400 words.');
    }
  };

  const handleDelete = async () => {
    try {
      setEditing(false);
      await deleteReview(rating.id, rating.expand.course.id);
      onDelete();
    } catch (error) {
      console.error("Error deleting review: ", error);
    }
  };

  const getProfilePicUrl = () => {
    if (user?.profilePic && user.profilePic.trim() !== '') {
      return `${NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${user.id}/${user.profilePic}`;
    } else {
      return defaultProfilePic;
    }
  };

  return (
    <div
      className="relative bg-white rounded-lg shadow-md p-4 my-4 mx-auto max-w-sm sm:max-w-md w-full"
      data-testid="rating-card"
    >
      {/* Actions */}
      <div className="absolute top-2 right-2 flex flex-col items-end space-y-2">
        {userVal?.userData?.id === user?.id && (
          <>
            {!isEditing && (
              <button
                data-testid="edit-button"
                onClick={() => setEditing(true)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✏️ Edit
              </button>
            )}
            
          </>
        )}
        {isEditing && (
          <>
            <button
              onClick={handleSave}
              className="text-green-500 hover:text-green-700"
            >
              ✅ Save
            </button>
            <button
                data-testid="delete-button"
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700"
              >
                🗑️ Delete
              </button>
          </>
          
          
        )}
      </div>

      {/* User Info */}
      <div className="flex flex-col items-center w-full mt-4">
        {rating.anonymous ? (
          <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden">
            <img src="/images/user.png" alt="Anonymous User" className="w-full h-full object-cover" />
          </div>
        ) : (
          <Link href={`/profile/${user?.id}`}>
            <img
              src={getProfilePicUrl()}
              alt="User Profile"
              className="w-12 h-12 rounded-full object-cover"
            />
          </Link>
        )}
        {rating.anonymous ? (
          <h3 className="text-lg font-semibold mt-2">Anonymous</h3>
        ) : (
          <Link href={`/profile/${user?.id}`}>
            <h3 className="text-lg font-semibold hover:text-blue-700 hover:underline mt-2">
              {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
            </h3>
          </Link>
        )}
      </div>

      {/* Course Info */}
      <div className="text-center mt-2">
        {rating ? (
          <Link href={`/course?id=${rating.expand.course.id}&code=${rating.expand.course.code}`}>
            <p className="text-gray-800 text-sm font-medium hover:text-blue-700 hover:underline">
              {`${rating.expand.course.code} - ${rating.expand.course.name}`}
            </p>
          </Link>
        ) : (
          <p className="text-gray-800 text-sm font-medium">Loading...</p>
        )}
      </div>

      {/* Rating */}
      <div className="flex justify-center items-center mt-2 space-x-2">
        {/* Rating Number in a Small Box */}
        <RatingBox rating={starRating || 'N/A'} size="small" />
        <StarRating
          rating={starRating}
          readOnly={!isEditing}
          size={24}
          onRatingChange={(newRating) => setStarRating(newRating)}
        />
      </div>

      {/* Professor Name */}
      {isEditing ? (
        <div className="mt-4">
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={professorFirstName}
              onChange={(e) => setProfessorFirstName(e.target.value)}
              placeholder="Professor's First Name"
              className="p-2 border border-gray-300 rounded w-1/2"
            />
            <input
              type="text"
              value={professorLastName}
              onChange={(e) => setProfessorLastName(e.target.value)}
              placeholder="Professor's Last Name"
              className="p-2 border border-gray-300 rounded w-1/2"
            />
          </div>

          {/* Syllabus Upload */}
          <div className="mt-2">
            <label htmlFor="syllabus-upload" className="block text-gray-700 mb-2">
              Upload Syllabus:
            </label>
            <input
              type="file"
              id="syllabus-upload"
              accept=".pdf,.doc,.docx"
              onChange={handleSyllabusChange}
              className="block w-full p-2 border rounded"
            />
          </div>
        </div>
      ) : (
        <>
          {/* Professor Display */}
          {rating.expand?.professors?.length > 0 && rating.expand.professors[0].firstName && (
            <div className="mt-1 mb-1 mx-auto w-fit px-3 py-1 border border-gray-300 rounded bg-gray-200 text-center text-sm">
              <h3 className="text-gray-800 font-semibold">
                Professor:{" "}
                {rating.expand.professors.map((prof, idx) => (
                  <span key={prof.id} className="font-normal">
                    {prof.firstName} {prof.lastName}
                    {idx < rating.expand.professors.length - 1 ? ", " : ""}
                  </span>
                ))}
              </h3>
            </div>
          )}

          {/* Syllabus Download */}
          {syllabusUrl && (
            <div className="mt-2 text-center">
              <a
                href={syllabusUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                Download Syllabus
              </a>
            </div>
          )}
        </>
      )}

      {/* Comment */}
      <div className="mt-4">
        {isEditing ? (
          <>
            <textarea
              placeholder="Edit your comment"
              value={comment}
              onChange={handleCommentChange}
              className="w-full p-2 border border-gray-300 rounded"
              style={{
                resize: 'vertical',
                minHeight: '100px',
                fontSize: '16px',
              }}
            />
            <p style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>
              {wordCount}/400 words
            </p>
            {errorMessage && (
              <p style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>
                {errorMessage}
              </p>
            )}
          </>
        ) : (
          <p
            data-testid="review-comment"
            className="text-gray-700 text-center break-words whitespace-normal overflow-y-auto max-h-24 border border-gray-300 rounded-md p-3"
            style={{
              lineHeight: '1.5',
            }}
          >
            {comment}
          </p>
        )}
      </div>
    </div>
  );
}
