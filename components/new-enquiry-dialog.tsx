"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEnquiryStore } from "@/lib/store";
import { useAnalyze } from "@/lib/use-analyze";

export function NewEnquiryDialog() {
  const [open, setOpen] = useState(false);
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const addEnquiry = useEnquiryStore((s) => s.addEnquiry);
  const analyze = useAnalyze();

  const submit = async () => {
    if (!body.trim()) return;
    const id = `usr-${Date.now().toString(36)}`;
    addEnquiry({
      id,
      received_at: new Date().toISOString(),
      from_name: fromName.trim() || "Unknown sender",
      from_email: fromEmail.trim() || "unknown@example.com",
      subject: subject.trim() || "(no subject)",
      body: body.trim(),
    });
    setOpen(false);
    setFromName("");
    setFromEmail("");
    setSubject("");
    setBody("");
    await analyze(id, body.trim());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="h-4 w-4 mr-1.5" />
        New enquiry
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Paste a new enquiry</DialogTitle>
          <DialogDescription>
            Paste any text — typical emails, web-form submissions, even nonsense or prompt-injection attempts.
            The AI analyses it live (~5s).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="from-name">From (name)</Label>
              <Input
                id="from-name"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="optional"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="from-email">From (email)</Label>
              <Input
                id="from-email"
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="optional"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="optional"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="body">Enquiry text *</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="Paste the enquiry body here…"
              className="mt-1 font-sans"
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!body.trim()}>
            Analyse
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
