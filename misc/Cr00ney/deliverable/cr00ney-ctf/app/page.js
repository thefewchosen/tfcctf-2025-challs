"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, Heart } from "lucide-react"

export default function Home() {
  const [fileName, setFileName] = useState("")
  const [preview, setPreview] = useState("")
  const [loading, setLoading] = useState(false)

  const files = [
    { value: "croon.txt", label: "croon.txt", size: "2.4 KB" },
    { value: "iraq.txt", label: "iraq.txt", size: "1.8 KB" },
    { value: "waltz.txt", label: "waltz.txt", size: "3.2 KB" },
  ]

  async function handleDownload() {
    if (!fileName) return
    setLoading(true)
    setPreview("") // clear old preview

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: "localhost",
          filename: fileName,
          keyPath: "/root/.ssh/id_rsa",
          downloadPath: "/app/downloads/",
        }),
      })

      const data = await response.json()
      if (data.ok && typeof data.content === "string") {
        setPreview(data.content)
      } else {
        alert("Download failed: " + (data.message || "unknown error"))
      }
    } catch (e) {
      alert("Download failed: " + (e?.message || String(e)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-50 dark:from-orange-950/40 dark:via-amber-950/30 dark:to-yellow-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800/60 dark:to-amber-800/60 rounded-full mb-6 shadow-lg border-4 border-white dark:border-orange-900/30">
            <div className="absolute -top-3 -left-4 w-8 h-12 bg-orange-200 dark:bg-orange-800/60 rounded-full transform -rotate-12 border-2 border-white dark:border-orange-900/30"></div>
            <div className="absolute -top-3 -right-4 w-8 h-12 bg-orange-200 dark:bg-orange-800/60 rounded-full transform rotate-12 border-2 border-white dark:border-orange-900/30"></div>

            <div className="w-20 h-20 bg-gradient-to-br from-orange-300 to-amber-300 dark:from-orange-700 dark:to-amber-700 rounded-full flex items-center justify-center relative">
              <div className="absolute top-4 left-3 w-3 h-3 bg-orange-900 dark:bg-orange-100 rounded-full"></div>
              <div className="absolute top-4 right-3 w-3 h-3 bg-orange-900 dark:bg-orange-100 rounded-full"></div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-orange-900 dark:bg-orange-100 rounded-full"></div>
              <div className="absolute bottom-3 left-6 w-1 h-2 bg-white dark:bg-orange-200 rounded-sm"></div>
              <div className="absolute bottom-3 right-6 w-1 h-2 bg-white dark:bg-orange-200 rounded-sm"></div>
            </div>

            <Heart className="absolute -bottom-1 -right-1 w-4 h-4 text-red-400 fill-current" />
          </div>
          <h1 className="text-4xl font-bold text-orange-900 dark:text-orange-100 mb-2 font-serif">Cr00ney</h1>
          <p className="text-lg text-orange-700 dark:text-orange-300">your labubu file friend</p>
        </div>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-orange-50/95 to-amber-50/95 dark:from-orange-950/80 dark:to-amber-950/80 backdrop-blur-sm rounded-3xl overflow-hidden border-2 border-orange-200/50 dark:border-orange-800/30">
          <CardHeader className="text-center pb-6 bg-gradient-to-r from-orange-100/60 to-amber-100/60 dark:from-orange-900/30 dark:to-amber-900/30">
            <CardTitle className="text-2xl text-orange-900 dark:text-orange-100 font-serif">Cozy Downloads</CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              labubu helps you find the perfect file
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 p-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-400 dark:bg-orange-600 rounded-full relative">
                  <div className="absolute -top-1 -left-1 w-1.5 h-2 bg-orange-400 dark:bg-orange-600 rounded-full transform -rotate-12"></div>
                  <div className="absolute -top-1 -right-1 w-1.5 h-2 bg-orange-400 dark:bg-orange-600 rounded-full transform rotate-12"></div>
                </div>
                choose your file
              </label>
              <Select
                value={fileName}
                onValueChange={(v) => {
                  setFileName(v)
                  setPreview("") // clear preview when switching file
                }}
              >
                <SelectTrigger className="w-full h-14 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/40 dark:to-amber-950/40 border-2 border-orange-300/60 dark:border-orange-700/60 rounded-2xl hover:border-orange-400/80 dark:hover:border-orange-600/80 transition-colors">
                  <SelectValue placeholder="select a cozy file" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2 border-orange-300/60 dark:border-orange-700/60 bg-orange-50/95 dark:bg-orange-950/95">
                  {files.map((file) => (
                    <SelectItem
                      key={file.value}
                      value={file.value}
                      className="rounded-xl hover:bg-orange-100/80 dark:hover:bg-orange-900/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-400 dark:from-orange-600 dark:to-amber-600 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-orange-900 dark:text-orange-100">{file.label}</span>
                        <span className="text-xs text-orange-700 dark:text-orange-300 bg-orange-200/80 dark:bg-orange-800/60 px-2 py-1 rounded-full">
                          {file.size}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleDownload}
              disabled={!fileName || loading}
              className="w-full h-14 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 dark:from-orange-700 dark:via-amber-700 dark:to-yellow-700 dark:hover:from-orange-800 dark:hover:via-amber-800 dark:hover:to-yellow-800 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-6 h-6 mr-3" />
              {loading ? "loading..." : fileName ? `download ${fileName}` : "pick something cozy"}
            </Button>

            <div className="border-3 border-dashed border-orange-300/60 dark:border-orange-700/60 rounded-3xl p-8 min-h-[220px] bg-gradient-to-br from-orange-50/60 to-amber-50/60 dark:from-orange-950/40 dark:to-amber-950/40 flex items-center justify-center">
              {preview ? (
                <div className="w-full max-h-64 overflow-auto">
                  <pre className="whitespace-pre-wrap break-words text-sm text-orange-900 dark:text-orange-100 font-mono">
                    {preview}
                  </pre>
                </div>
              ) : fileName ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-400 dark:from-orange-600 dark:to-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-md transform rotate-2">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-orange-900 dark:text-orange-100 font-bold text-lg font-serif">
                    preview:{" "}
                    <span className="text-transparent bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text">
                      {fileName}
                    </span>
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">press download to load preview</p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800/60 dark:to-amber-800/60 rounded-full flex items-center justify-center mx-auto transform -rotate-3 border-4 border-white dark:border-orange-900/30 relative">
                    <div className="absolute -top-2 -left-3 w-6 h-8 bg-orange-200 dark:bg-orange-800/60 rounded-full transform -rotate-12"></div>
                    <div className="absolute -top-2 -right-3 w-6 h-8 bg-orange-200 dark:bg-orange-800/60 rounded-full transform rotate-12"></div>
                    <div className="absolute top-6 left-4 w-2 h-1 bg-orange-900 dark:bg-orange-100 rounded-full"></div>
                    <div className="absolute top-6 right-4 w-2 h-1 bg-orange-900 dark:bg-orange-100 rounded-full"></div>
                    <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-900 dark:bg-orange-100 rounded-full"></div>
                    <div className="absolute -top-4 -right-6 text-xs text-orange-600 dark:text-orange-400 font-bold">
                      zzz
                    </div>
                  </div>
                  <p className="text-orange-600 dark:text-orange-400 font-medium font-serif">
                    labubu is waiting... pick a file to wake them up!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">made with labubu love</p>
        </div>
      </div>
    </main>
  )
}