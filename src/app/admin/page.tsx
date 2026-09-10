"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Source {
  id: string;
  type: string;
  title: string;
  created_at: string;
}

type SourceType = "file" | "text" | "url";

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [stats, setStats] = useState({ totalSources: 0, totalChunks: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SourceType>("file");

  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [urlInput, setUrlInput] = useState("");

  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin_auth") : null;

  useEffect(() => {
    if (adminPassword === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchSources();
      fetchStats();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "demo123") {
      localStorage.setItem("admin_auth", password);
      setIsAuthenticated(true);
      fetchSources();
      fetchStats();
    } else {
      alert("Incorrect password");
    }
  };

  const fetchSources = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("sources")
        .select("id, type, title, created_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSources(data);
      }
    } catch (error) {
      console.error("Error fetching sources:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      const { count: sourcesCount } = await supabase
        .from("sources")
        .select("*", { count: "exact", head: true });

      const { count: chunksCount } = await supabase
        .from("chunks")
        .select("*", { count: "exact", head: true });

      setStats({
        totalSources: sourcesCount || 0,
        totalChunks: chunksCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const authKey = localStorage.getItem("admin_auth") || "";
      let response;

      if (activeTab === "file" && file) {
        const formData = new FormData();
        formData.append("file", file);
        
        response = await fetch("/api/add-source", {
          method: "POST",
          headers: {
            "x-admin-password": authKey,
          },
          body: formData,
        });
      } else if (activeTab === "text") {
        response = await fetch("/api/add-source", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": authKey,
          },
          body: JSON.stringify({
            type: "text",
            title: textTitle || "Untitled Text",
            content: textContent,
          }),
        });
      } else if (activeTab === "url") {
        response = await fetch("/api/add-source", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": authKey,
          },
          body: JSON.stringify({
            type: "url",
            url: urlInput,
          }),
        });
      }

      if (response?.ok) {
        alert("Source added successfully!");
        setFile(null);
        setTextContent("");
        setTextTitle("");
        setUrlInput("");
        fetchSources();
        fetchStats();
      } else {
        const data = await response?.json();
        alert(`Error: ${data?.error || "Failed to add source"}`);
      }
    } catch (error) {
      console.error("Error adding source:", error);
      alert("Failed to add source");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm("Are you sure you want to delete this source?")) return;

    try {
      const authKey = localStorage.getItem("admin_auth") || "";
      const response = await fetch("/api/delete-source", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": authKey,
        },
        body: JSON.stringify({ sourceId }),
      });

      if (response.ok) {
        fetchSources();
        fetchStats();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || "Failed to delete source"}`);
      }
    } catch (error) {
      console.error("Error deleting source:", error);
      alert("Failed to delete source");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
            Admin Login
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin password"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-black p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Sources</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalSources}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Chunks</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalChunks}</p>
          </div>
        </div>

        {/* Add Source Form */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Add Source</h2>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("file")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "file"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              File
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "text"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setActiveTab("url")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "url"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              URL
            </button>
          </div>

          <form onSubmit={handleAddSource} className="space-y-4">
            {activeTab === "file" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Upload File
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.xlsx,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            )}

            {activeTab === "text" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Document title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Content
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Paste your text content here..."
                  />
                </div>
              </>
            )}

            {activeTab === "url" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/article"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? "Adding..." : "Add Source"}
            </button>
          </form>
        </div>

        {/* Existing Sources */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Existing Sources</h2>
          {sources.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No sources yet. Add one above.</p>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{source.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {source.type} • {new Date(source.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteSource(source.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deployment Info */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Deployment</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Embed Code</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`<iframe src="https://your-domain.com" width="100%" height="600"></iframe>`}</code>
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Telegram Setup</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>Create a bot via @BotFather on Telegram and get your bot token</li>
                <li>Set the TELEGRAM_BOT_TOKEN environment variable</li>
                <li>Set up the webhook:
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded mt-2 text-xs overflow-x-auto">
                    <code>{`curl -X POST https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://your-domain.com/api/telegram-webhook`}</code>
                  </pre>
                </li>
                <li>Your bot will now respond to messages using your knowledge base</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
