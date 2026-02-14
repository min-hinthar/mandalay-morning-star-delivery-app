"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCallback } from "react";

// ===========================================
// TYPES
// ===========================================

interface TiptapEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

// ===========================================
// TOOLBAR BUTTON
// ===========================================

function ToolbarButton({
  onClick,
  isActive,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  isActive: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "p-1.5 rounded transition-colors",
        isActive
          ? "bg-interactive-primary/20 text-interactive-primary"
          : "text-text-muted hover:text-text-primary hover:bg-surface-secondary"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

// ===========================================
// TIPTAP EDITOR
// ===========================================

export function TiptapEditor({
  content = "",
  onChange,
  placeholder = "Write your email...",
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "text-interactive-primary underline" },
      }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none min-h-[150px] px-3 py-2",
          "text-text-primary focus:outline-none",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_p.is-editor-empty:first-child::before]:text-text-muted",
          "[&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_p.is-editor-empty:first-child::before]:float-left",
          "[&_p.is-editor-empty:first-child::before]:h-0",
          "[&_p.is-editor-empty:first-child::before]:pointer-events-none"
        ),
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previousUrl || "https://");

    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="rounded-card-sm border border-border-subtle focus-within:ring-2 focus-within:ring-interactive-primary/30 focus-within:border-interactive-primary transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border-subtle bg-surface-secondary/30">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          icon={Bold}
          label="Bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          icon={Italic}
          label="Italic"
        />
        <div className="w-px h-4 bg-border-subtle mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          icon={List}
          label="Bullet list"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          icon={ListOrdered}
          label="Ordered list"
        />
        <div className="w-px h-4 bg-border-subtle mx-1" />
        <ToolbarButton
          onClick={setLink}
          isActive={editor.isActive("link")}
          icon={Link2}
          label="Link"
        />
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
