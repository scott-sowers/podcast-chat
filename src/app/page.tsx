import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const { userId } = await auth();

  // Redirect authenticated users to their library
  if (userId) {
    redirect("/library");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <main className="flex flex-col items-center gap-8 text-center max-w-2xl">
        <div className="text-6xl">🎙️</div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Podcast Chat
        </h1>
        <p className="text-xl text-muted-foreground">
          AI-powered conversations with your favorite podcasts. Search, sync,
          and chat with podcast content using natural language.
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/sign-up">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 text-left">
          <div className="p-6 border rounded-lg">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-semibold mb-1">Search Podcasts</h3>
            <p className="text-sm text-muted-foreground">
              Find podcasts from millions of shows and add them to your library.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <div className="text-2xl mb-2">📝</div>
            <h3 className="font-semibold mb-1">Sync Transcripts</h3>
            <p className="text-sm text-muted-foreground">
              Automatically sync episode transcripts for AI-powered search.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <div className="text-2xl mb-2">💬</div>
            <h3 className="font-semibold mb-1">Chat with Content</h3>
            <p className="text-sm text-muted-foreground">
              Ask questions and get answers with citations from your podcasts.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
