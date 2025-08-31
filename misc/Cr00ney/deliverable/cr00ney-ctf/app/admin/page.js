"use client"

import { useEffect, useState } from "react"

export default function AdminPage() {
  const [flag, setFlag] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/admin")
      .then(res => res.json())
      .then(data => {
        setFlag(data.flag)
        setLoading(false)
      })
      .catch(() => {
        setError("Could not fetch flag.")
        setLoading(false)
      })
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-50 dark:from-orange-950/40 dark:via-amber-950/30 dark:to-yellow-950/20 p-4">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-orange-50/95 to-amber-50/95 dark:from-orange-950/80 dark:to-amber-950/80 shadow-xl rounded-3xl p-8 border-2 border-orange-200/50 dark:border-orange-800/30 text-center">
          <h1 className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-4 font-serif">Admin Flag</h1>
          {loading ? (
            <p className="text-orange-700 dark:text-orange-300">Loading...</p>
          ) : error ? (
            <p className="text-red-600 dark:text-red-400">{error}</p>
          ) : (
            <div className="text-lg font-mono text-orange-800 dark:text-orange-200 bg-orange-100 dark:bg-orange-900/40 rounded-xl p-4 select-all break-all">
              {flag}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
