import { BrandMark } from "@/components/ui/brand-mark";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({
  message = "Carregando",
}: LoadingScreenProps) {
  return (
    <main className="nucleo-grid flex min-h-screen items-center justify-center px-6">
      <div className="flex flex-col items-center">
        <div className="animate-nucleo-pulse">
          <BrandMark />
        </div>

        <div className="mt-8 flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-300" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-700 [animation-delay:300ms]" />
        </div>

        <p className="mt-4 text-sm text-zinc-500">
          {message}
        </p>
      </div>
    </main>
  );
}