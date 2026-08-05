import { useMemo } from "react";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

interface RichTextViewerProps {
  content: string | null | undefined;
  className?: string;
}

export function RichTextViewer({ content, className = "" }: RichTextViewerProps) {
  const htmlContent = useMemo(() => {
    if (!content) return "";
    
    // Check if the content is already HTML (basic heuristic)
    if (content.trim().startsWith("<") && content.includes(">")) {
      return content;
    }
    
    // If it's a Tiptap JSON document string, parse and convert it
    try {
      const parsed = JSON.parse(content);
      return generateHTML(parsed, [
        StarterKit,
        Underline,
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        Link.configure({
          openOnClick: false,
        }),
        Image,
      ]);
    } catch {
      // If it's neither HTML nor JSON, just wrap it in a paragraph
      return `<p>${content}</p>`;
    }
  }, [content]);

  if (!htmlContent) return null;

  return (
    <div 
      className={`prose prose-sm sm:prose-base dark:prose-invert max-w-none 
        prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-img:rounded-xl prose-img:shadow-sm ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
