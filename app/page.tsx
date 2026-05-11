import { Header } from "@/components/header";
import { InboxList } from "@/components/inbox-list";
import { EnquiryDetail } from "@/components/enquiry-detail";

export default function Page() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[340px] border-r border-border/60 overflow-y-auto bg-background scrollbar-thin shrink-0">
          <InboxList />
        </aside>
        <main className="flex-1 overflow-y-auto bg-muted/30 scrollbar-thin">
          <EnquiryDetail />
        </main>
      </div>
    </div>
  );
}
