// src/pages/NotFound.tsx
import { Link } from "react-router-dom";

const NotFound=()=> {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4">
      <h1 className="text-6xl font-bold text-red-600">404</h1>
      <p className="text-2xl mt-4 text-gray-700">Page Not Found</p>
      <p className="mt-2 text-gray-500">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Go Home
      </Link>
    </div>
  );
}

export default NotFound;