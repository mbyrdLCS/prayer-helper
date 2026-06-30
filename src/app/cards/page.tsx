import { today } from "@/lib/dates";
import { APP_NAME } from "@/lib/config";
import CardDownloader from "@/components/CardDownloader";

export const dynamic = "force-dynamic";

export default function CardsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold">Daily Cards</h1>
        <p className="text-muted max-w-2xl">
          The site builds each day&apos;s <span className="script text-primary text-lg">{APP_NAME}</span>{" "}
          card automatically. Download today&apos;s, a whole week, or a month at
          once — already labeled and ready to post in the group.
        </p>
      </header>
      <CardDownloader today={today()} />
    </div>
  );
}
