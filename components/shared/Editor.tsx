"use client";

import React, { useEffect, useCallback } from "react";
import { useEditor, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  RemoveFormatting,
} from "lucide-react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

const sanitizeHTML = (html: string) => {
  // Strips out carriage returns (\r), zero-width spaces (\u200b, \u200c), soft hyphens (\u00ad), standard pipes (|), and ASCII 127 DEL characters (\x7f)
  return html ? html.replace(/[\r\u200b\u200c\u00ad|\x7f]/g, "") : "";
};

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-200 ${
        active ? "bg-gray-200 text-gray-900" : ""
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: TiptapEditor }) {
  const setLink = useCallback(() => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previous ?? "https://");
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt("Enter image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-1.5">
      <ToolbarButton
        title="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-gray-300" />

      <ToolbarButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Blockquote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-gray-300" />

      <ToolbarButton
        title="Ordered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-gray-300" />

      <ToolbarButton title="Link" active={editor.isActive("link")} onClick={setLink}>
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Image" onClick={addImage}>
        <ImageIcon className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-gray-300" />

      <ToolbarButton
        title="Clear formatting"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
      >
        <RemoveFormatting className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

export default function Editor({ value, onChange, readOnly = false }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: readOnly ? true : false },
      }),
      Image,
      Placeholder.configure({
        placeholder: readOnly ? "" : "Write your description here...",
      }),
    ],
    content: value,
    editable: !readOnly,
    // Required under Next.js SSR to avoid hydration mismatch.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: readOnly
          ? "editor-content editor-content-readonly focus:outline-none"
          : "editor-content focus:outline-none",
      },
    },
    onUpdate: readOnly
      ? undefined
      : ({ editor }) => {
          onChange(sanitizeHTML(editor.getHTML()));
        },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  // Keep the editor in sync when `value` is set externally (e.g. the edit page
  // loads the idea asynchronously after mount).
  useEffect(() => {
    if (!editor) return;
    const incoming = value ?? "";
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {editor && !readOnly ? <Toolbar editor={editor} /> : null}
      <EditorContent editor={editor} />

      {/* TipTap ships unstyled and Tailwind preflight strips list markers /
          heading sizes, so restore editor typography here. */}
      <style jsx global>{`
        .editor-content {
          min-height: 250px;
          padding: 0.75rem 1rem;
          font-size: 16px;
          line-height: 1.6;
        }
        .editor-content-readonly {
          min-height: auto;
        }
        .editor-content p {
          margin: 0.25rem 0;
        }
        .editor-content h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0.75rem 0 0.5rem;
        }
        .editor-content h2 {
          font-size: 1.375rem;
          font-weight: 700;
          margin: 0.75rem 0 0.5rem;
        }
        .editor-content ul {
          list-style: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .editor-content ol {
          list-style: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .editor-content blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1rem;
          color: #4b5563;
          margin: 0.5rem 0;
        }
        .editor-content a {
          color: #2563eb;
          text-decoration: underline;
        }
        .editor-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
        /* Placeholder */
        .editor-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
