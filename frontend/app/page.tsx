export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Investing Assistant</h1>
        <p className="text-lg text-slate-600 mb-8">
          Your personalized guide to smart investing
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
          >
            Login
          </a>
          <a
            href="/register"
            className="px-6 py-3 border border-slate-900 text-slate-900 rounded-lg hover:bg-slate-50 transition"
          >
            Sign Up
          </a>
        </div>
      </div>
    </main>
  )
}
