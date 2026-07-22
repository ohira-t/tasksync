"use client";

import { useEffect, useRef, useState } from "react";
import { Task } from "@/lib/types";
import { buildBacklogSubject, buildBacklogBody } from "@/lib/backlog-copy";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// クリップボードAPIが使えない環境(非HTTPS等)向けの手動コピー用ダイアログ。
// テキストを選択済みで表示し、Ctrl+C してもらう
function CopyFallbackDialog({
  text,
  onClose,
}: {
  text: string;
  onClose: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>手動でコピーしてください</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          自動コピーが使えない環境のため、選択済みのテキストを Ctrl+C（Mac は
          ⌘+C）でコピーしてください。
        </p>
        <Textarea
          ref={textareaRef}
          readOnly
          value={text}
          rows={10}
          onFocus={(e) => e.currentTarget.select()}
        />
      </DialogContent>
    </Dialog>
  );
}

export function BacklogCopyMenu({
  task,
  compact = false,
}: {
  task: Task;
  // true ならカード用の小さなアイコンボタンにする
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [fallbackText, setFallbackText] = useState<string | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(timerRef.current);
  }, []);

  async function copy(text: string) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("unavailable");
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setFallbackText(text);
    }
  }

  const taskUrl = () =>
    `${window.location.origin}/?task=${encodeURIComponent(task.id)}`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            compact ? (
              <button
                type="button"
                title="Backlog用にコピー"
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              />
            ) : (
              <Button variant="outline" size="sm" />
            )
          }
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {!compact && (copied ? "コピーしました" : "Backlog用にコピー")}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-44">
          <DropdownMenuItem onClick={() => copy(buildBacklogSubject(task))}>
            件名をコピー
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => copy(buildBacklogBody(task, taskUrl()))}>
            本文をコピー
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {fallbackText !== null && (
        <CopyFallbackDialog
          text={fallbackText}
          onClose={() => setFallbackText(null)}
        />
      )}
    </>
  );
}
