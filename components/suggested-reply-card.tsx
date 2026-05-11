"use client";

import { useState } from "react";
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

  const reset = (next: SuggestedReply) => {
    setSubject(next.subject);
    setBody(next.body);
  };
  // Reset when prop changes
  if (reply.subject !== subject && !editing && reply.subject !== "" && body === "") {
    reset(reply);
  }

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-emerald-500" />
          Suggested reply
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="reply-subject" className="text-xs uppercase tracking-wider text-muted-foreground">
            Subject
          </Label>
          {editing ? (
            <Input id="reply-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
          ) : (
            <p className="mt-1 text-sm font-medium">{subject}</p>
          )}
        </div>
        <div>
          <Label htmlFor="reply-body" className="text-xs uppercase tracking-wider text-muted-foreground">
            Body
          </Label>
          {editing ? (
            <Textarea
              id="reply-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="mt-1 font-sans text-sm"
            />
          ) : (
            <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">{body}</p>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={copyToClipboard}>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copy
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing((e) => !e)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            {editing ? "Done" : "Edit"}
          </Button>
          <Button size="sm" onClick={fakeSend}>
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Send (mock)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
