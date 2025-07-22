import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 min-h-[100vh]">
      <h1 className="gradient-heading text-4xl md:text-6xl mb-4">404</h1>
      <h2 className="text-2xl font-extrabold mb-4">Page Not Found</h2>
      <Link href="/" className="text-green-500 hover:underline">Return Home</Link>
    </div>
  )
}