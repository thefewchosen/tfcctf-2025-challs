"use client"


import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Register() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (data.success) {
      setMessage("Registration successful! You can now log in.")
    } else {
      setMessage(data.error || "Registration failed.")
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-50 dark:from-orange-950/40 dark:via-amber-950/30 dark:to-yellow-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-gradient-to-br from-orange-50/95 to-amber-50/95 dark:from-orange-950/80 dark:to-amber-950/80 backdrop-blur-sm rounded-3xl overflow-hidden border-2 border-orange-200/50 dark:border-orange-800/30">
          <CardHeader className="text-center pb-6 bg-gradient-to-r from-orange-100/60 to-amber-100/60 dark:from-orange-900/30 dark:to-amber-900/30">
            <CardTitle className="text-2xl text-orange-900 dark:text-orange-100 font-serif">Register</CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              Create a new account to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <form onSubmit={handleRegister} className="space-y-4">
              <input
                className="border p-3 rounded-xl w-full bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/40 dark:to-amber-950/40 border-2 border-orange-300/60 dark:border-orange-700/60 focus:outline-none focus:ring-2 focus:ring-orange-400"
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
              <input
                className="border p-3 rounded-xl w-full bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/40 dark:to-amber-950/40 border-2 border-orange-300/60 dark:border-orange-700/60 focus:outline-none focus:ring-2 focus:ring-orange-400"
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <Button
                className="w-full h-12 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 dark:from-orange-700 dark:via-amber-700 dark:to-yellow-700 dark:hover:from-orange-800 dark:hover:via-amber-800 dark:hover:to-yellow-800 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                type="submit"
                disabled={loading}
              >
                {loading ? "Registering..." : "Register"}
              </Button>
              {message && <div className="mt-2 text-center text-sm text-orange-700 dark:text-orange-300">{message}</div>}
            </form>
          </CardContent>
        </Card>
        <div className="text-center mt-4">
          <span className="text-orange-700 dark:text-orange-300">Already have an account? </span>
          <Link href="/login" className="text-orange-900 dark:text-orange-100 underline font-semibold">Login</Link>
        </div>
      </div>
    </main>
  )
}
