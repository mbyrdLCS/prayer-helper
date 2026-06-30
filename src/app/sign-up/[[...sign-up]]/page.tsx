import { SignUp } from "@clerk/nextjs";
import { APP_NAME } from "@/lib/config";

export default function Page() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center">
      <div>
        <h1 className="script text-5xl text-primary">{APP_NAME}</h1>
        <p className="text-muted mt-1 max-w-sm">
          Join the group&apos;s private prayer space. You can sign up with your
          email or continue with Facebook.
        </p>
      </div>
      <SignUp />
    </div>
  );
}
