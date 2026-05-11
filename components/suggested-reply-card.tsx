"use client";

import { useEffect, useState } from "react";
import { Copy, Mail, Pencil, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { SuggestedReply } from "@/lib/schema";

export function SuggestedReplyCard({ reply }: { reply: SuggestedReply }) {
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(reply.subject);
  const [body, setBody] = useState(reply.body);

  useEffect(() => {
    setSubject(reply.subject);
    setBody(reply.body);
    setEditing(false);
  }, [reply.subject, reply.body]);

  const copyToClipboard = async () => {
    const text = `Subject: ${subject}\n\n${body}`;
    await navigator.clipboard.writeText(text);
    toast.success("Reply copied to clipboard");
  };

  const fakeSend = () => {
    toast.success("Reply sent (demo only — no real email integration)");
    setEditing(false);
  };

  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Mail className="h-3.5 w-3.5 text-emerald-500" />
          Suggested reply
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="reply-subject" className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-medium">
            Subject
          </Label>
          {editing ? (
            <Input id="reply-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1.5 text-sm" />
          ) : (
            <p className="mt-1.5 text-sm font-medium">{subject}</p>
          )}
        </div>
        <div className="border-t border-border/60 pt-3">
          <Label htmlFor="reply-body" className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-medium">
            Body
          </Label>
          {editing ? (
            <Textarea
              id="reply-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="mt-1.5 font-sans text-sm leading-relaxed"
            />
          ) : (
            <p className="mt-1.5 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {body}
            </p>
          )}
        </div>
        <div className="flex gap-2 pt-2 border-t border-border/60">
          <Button size="sm" variant="outline" onClick={copyToClipboard} className="text-xs">
            <Copy className="h-3 w-3 mr-1.5" />
            Copy
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing((e) => !e)} className="text-xs">
            <Pencil className="h-3 w-3 mr-1.5" />
            {editing ? "Done" : "Edit"}
          </Button>
          <div className="flex-1" />
          <Button size="sm" onClick={fakeSend} className="text-xs">
            <Send className="h-3 w-3 mr-1.5" />
            Send
            <span className="ml-1 text-[10px] opacity-70">(demo)</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
