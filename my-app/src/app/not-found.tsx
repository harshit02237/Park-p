import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white text-black text-center px-6">
      <h1 className="text-7xl font-extrabold">
        404
      </h1>
      <h2 className="text-3xl font-semibold mt-4">
        Oops! Page not found.
      </h2>
      <p className="text-lg mt-2 mb-8 max-w-md text-gray-600">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-md shadow hover:bg-blue-700 transition-colors"
      >
        Go Back Home
      </Link>
    </div>
  );
}
