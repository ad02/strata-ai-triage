import { Header } from "@/components/header";
import { InboxList } from "@/components/inbox-list";
import { EnquiryDetail } from "@/components/enquiry-detail";

export default function Page() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r overflow-y-auto bg-background">
          <InboxList />
        </aside>
        <main className="flex-1 overflow-y-auto bg-muted/20">
          <EnquiryDetail />
        </main>
      </div>
    </div>
  );
}
