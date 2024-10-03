'use client';
import NavBar from '../components/NavBar';



export default function savedCourses() {

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: `linear-gradient(
      0deg, 
      #C8D2F9 0%, 
      #7594A4 50%, 
      #84969F 79%, 
      #999999 100%)`,
      }}
    >
      <NavBar/>
      <h1> Saved Courses Page </h1>
    </div>
  );
}
