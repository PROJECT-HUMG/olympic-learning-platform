import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Link as LinkIcon,
  ImageIcon,
  Undo,
  Redo,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt("URL:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt("URL ảnh:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border p-1 bg-muted/40 rounded-t-md">
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive("bold") ? "bg-accent text-accent-foreground" : ""}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        type="button"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive("italic") ? "bg-accent text-accent-foreground" : ""}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        type="button"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive("underline") ? "bg-accent text-accent-foreground" : ""}`}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        type="button"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive("strike") ? "bg-accent text-accent-foreground" : ""}`}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        type="button"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive("heading", { level: 1 }) ? "bg-accent text-accent-foreground" : ""}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        type="button"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive("heading", { level: 2 }) ? "bg-accent text-accent-foreground" : ""}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        type="button"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive("heading", { level: 3 }) ? "bg-accent text-accent-foreground" : ""}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        type="button"
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive("bulletList") ? "bg-accent text-accent-foreground" : ""}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        type="button"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive("orderedList") ? "bg-accent text-accent-foreground" : ""}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        type="button"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive("blockquote") ? "bg-accent text-accent-foreground" : ""}`}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        type="button"
      >
        <Quote className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive({ textAlign: "left" }) ? "bg-accent text-accent-foreground" : ""}`}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        type="button"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive({ textAlign: "center" }) ? "bg-accent text-accent-foreground" : ""}`}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        type="button"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive({ textAlign: "right" }) ? "bg-accent text-accent-foreground" : ""}`}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        type="button"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive({ textAlign: "justify" }) ? "bg-accent text-accent-foreground" : ""}`}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        type="button"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive("link") ? "bg-accent text-accent-foreground" : ""}`}
        onClick={addLink}
        type="button"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={addImage}
        type="button"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
      <div className="flex-1" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        type="button"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        type="button"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function RichTextEditor({ value, onChange, placeholder = "Nhập nội dung..." }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-md max-w-full h-auto",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[300px] max-h-[600px] overflow-y-auto p-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="flex flex-col border border-input bg-background rounded-md shadow-sm focus-within:ring-1 focus-within:ring-ring overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
