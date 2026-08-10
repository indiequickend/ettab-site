"use client";

import { useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { BoldIcon, ItalicIcon, LinkIcon, ListIcon, ListOrderedIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function LinkButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setUrl(editor.getAttributes("link").href ?? "");
        }
      }}
    >
      <PopoverTrigger
        render={
          <ToolbarButton active={editor.isActive("link")} label="Link" onClick={() => {}} />
        }
      >
        <LinkIcon />
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="flex flex-col gap-2">
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            {editor.isActive("link") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  setOpen(false);
                }}
              >
                Remove
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const trimmed = url.trim();
                if (trimmed) {
                  editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
                }
                setOpen(false);
              }}
            >
              Add link
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function TourDescriptionEditor({
  name = "description",
  defaultValue = "",
}: {
  name?: string;
  defaultValue?: string;
}) {
  const [html, setHtml] = useState(defaultValue);

  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content: defaultValue,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      setHtml(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "min-h-40 rounded-b-lg px-3 py-2 text-sm outline-none",
      },
    },
  });

  return (
    <div className="rounded-lg border border-input">
      <div className="flex flex-wrap items-center gap-1 border-b border-input p-1.5">
        {editor && (
          <>
            <ToolbarButton
              active={editor.isActive("bold")}
              label="Bold"
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <BoldIcon />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("italic")}
              label="Italic"
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <ItalicIcon />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("bulletList")}
              label="Bullet list"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <ListIcon />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("orderedList")}
              label="Ordered list"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrderedIcon />
            </ToolbarButton>
            <LinkButton editor={editor} />
          </>
        )}
      </div>
      <EditorContent editor={editor} className={cn(!editor && "min-h-40")} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
