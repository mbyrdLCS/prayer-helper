import { SignIn } from "@clerk/nextjs";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";

export default function Page() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center">
      <div>
        <h1 className="script text-5xl text-primary">{APP_NAME}</h1>
        <p className="text-muted mt-1 max-w-sm">{APP_TAGLINE}</p>
      </div>
      <SignIn />
    </div>
  );
}
