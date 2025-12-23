import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrCreateUserProfile } from "@/lib/actions/user";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Ensure user has a profile
  await getOrCreateUserProfile();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/library" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">Podcast Chat</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/library"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Library
              </Link>
              <Link
                href="/search"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Search
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
