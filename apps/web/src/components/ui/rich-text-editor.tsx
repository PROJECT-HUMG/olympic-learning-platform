import { useState, useRef, useId, type ReactNode } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { storageService } from "@/features/documents/services/storage.service";
import { toast } from "sonner";
import { validatePostImage } from "@/features/post/lib/post-image-validation.ts";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link, { isAllowedUri } from "@tiptap/extension-link";
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
  Quote,
  Link as LinkIcon,
  ImageIcon,
  Undo,
  Redo,
  UploadCloud,
  Loader2,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onUploadingChange?: (uploading: boolean) => void;
}

interface ImageInsertDialogProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

function ImageInsertDialog({ children, open, onOpenChange, onInsert, onUploadingChange }: ImageInsertDialogProps) {
  const [tab, setTab] = useState("upload");
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInFlight = useRef(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // Permit choosing the same file after validation/failure.
    if (!file || uploadInFlight.current) return;
    const issue = validatePostImage(file);

    if (issue === "type") {
      toast.error("Định dạng không hợp lệ", { description: "Vui lòng chọn tệp hình ảnh." });
      return;
    }

    if (issue === "size") {
      toast.error("Tệp quá lớn", { description: "Kích thước ảnh tối đa là 5MB." });
      return;
    }

    uploadInFlight.current = true;
    try {
      setIsUploading(true);
      onUploadingChange?.(true);
      setProgress(0);
      
      const response = await storageService.uploadFile(file, "POST", (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      
      onInsert(response.url);
      onOpenChange(false);
      toast.success("Tải lên thành công");
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Tải lên thất bại", { description: "Đã có lỗi xảy ra. Vui lòng thử lại." });
    } finally {
      uploadInFlight.current = false;
      setIsUploading(false);
      onUploadingChange?.(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUrlInsert = () => {
    if (!uploadInFlight.current && urlInput.trim()) {
      onInsert(urlInput.trim());
      setUrlInput("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={next => { if (!uploadInFlight.current) onOpenChange(next); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chèn hình ảnh</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" disabled={isUploading}>Tải lên từ máy</TabsTrigger>
            <TabsTrigger value="url" disabled={isUploading}>Đường dẫn URL</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-4">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                aria-label="Chọn ảnh chèn vào bài viết"
                aria-busy={isUploading}
                disabled={isUploading}
                onClick={() => !uploadInFlight.current && fileInputRef.current?.click()}
                className="h-auto min-h-44 w-full flex-col gap-0 whitespace-normal rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 hover:border-primary/50 hover:bg-muted/50"
              >
                {isUploading ? (
                  <>
                    <Loader2 aria-hidden="true" className="mb-3 size-6 animate-spin text-primary" />
                    <span className="text-sm">Đang tải lên… {progress}%</span>
                  </>
                ) : (
                  <>
                    <span className="mb-3 rounded-full bg-primary/5 p-4 text-primary/70">
                      <UploadCloud aria-hidden="true" className="size-8" />
                    </span>
                    <span className="text-sm font-medium">Nhấn để chọn ảnh</span>
                    <span className="mt-1 text-center text-xs font-normal text-muted-foreground">Hỗ trợ JPEG, PNG (Tối đa 5MB)</span>
                  </>
                )}
              </Button>
              {isUploading && <Progress aria-label="Tiến trình tải ảnh" value={progress} className="absolute inset-x-8 bottom-6 h-2 w-auto" />}
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Input 
                disabled={isUploading}
                placeholder="https://example.com/image.jpg" 
                value={urlInput} 
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlInsert()}
              />
            </div>
            <Button onClick={handleUrlInsert} className="w-full" disabled={isUploading || !urlInput.trim()}>
              Chèn ảnh
            </Button>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isUploading}
            onClick={() => { if (!uploadInFlight.current) onOpenChange(false); }}>Hủy</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const MenuBar = ({ editor, onUploadingChange }: { editor: Editor | null; onUploadingChange?: (uploading: boolean) => void }) => {
  const [isImageDialogOpen, setImageDialogOpen] = useState(false);
  const [isLinkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const linkSelection = useRef<{ from: number; to: number } | null>(null);
  const linkTrigger = useRef<HTMLButtonElement>(null);
  const linkInputId = useId();
  const linkErrorId = useId();

  if (!editor) {
    return null;
  }

  const currentHeadingLevel = editor.isActive("heading", { level: 1 }) ? "h1" 
    : editor.isActive("heading", { level: 2 }) ? "h2" 
    : editor.isActive("heading", { level: 3 }) ? "h3" 
    : "p";

  const handleHeadingChange = (value: string) => {
    if (value === "p") {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(value.replace("h", ""), 10) as 1 | 2 | 3;
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  const addLink = () => {
    const { from, to } = editor.state.selection;
    linkSelection.current = { from, to };
    setLinkUrl(editor.getAttributes("link").href ?? "");
    setLinkError("");
    setLinkDialogOpen(true);
  };

  const insertLink = () => {
    const href = linkUrl.trim();
    // Match the existing Link extension's URI safety policy (including mailto,
    // tel and relative links). Do not turn an unsafe URI into silent success.
    if (!href || !isAllowedUri(href)) {
      setLinkError("Nhập liên kết hợp lệ. Không hỗ trợ địa chỉ script hoặc dữ liệu.");
      return;
    }
    if (editor.isDestroyed || !linkSelection.current) return;
    const inserted = editor.chain().focus().setTextSelection(linkSelection.current)
      .extendMarkRange("link").setLink({ href }).run();
    if (!inserted) {
      setLinkError("Chưa chèn được liên kết. Kiểm tra địa chỉ và thử lại.");
      return;
    }
    setLinkDialogOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/20 p-2 rounded-t-md">
      
      {/* Kiểu chữ */}
      <div className="flex-shrink-0">
        <Select value={currentHeadingLevel} onValueChange={handleHeadingChange}>
          <SelectTrigger size="sm" className="h-11 w-[170px] max-w-full bg-background text-sm font-medium">
            <SelectValue placeholder="Kiểu chữ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="p">Văn bản thường</SelectItem>
            <SelectItem value="h1">
              <span className="font-bold text-lg">Tiêu đề 1</span>
            </SelectItem>
            <SelectItem value="h2">
              <span className="font-bold text-base">Tiêu đề 2</span>
            </SelectItem>
            <SelectItem value="h3">
              <span className="font-semibold text-sm">Tiêu đề 3</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Định dạng văn bản */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className={`h-11 w-11 ${editor.isActive("bold") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          type="button"
          title="In đậm"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-11 w-11 ${editor.isActive("italic") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          type="button"
          title="In nghiêng"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-11 w-11 ${editor.isActive("underline") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          type="button"
          title="Gạch chân"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-11 w-11 ${editor.isActive("strike") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          type="button"
          title="Gạch ngang"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Danh sách & Trích dẫn */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className={`h-11 w-11 ${editor.isActive("bulletList") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          type="button"
          title="Danh sách dấu chấm"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-11 w-11 ${editor.isActive("orderedList") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          type="button"
          title="Danh sách số"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-11 w-11 ${editor.isActive("blockquote") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          type="button"
          title="Trích dẫn"
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Căn lề */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className={`h-11 w-11 ${editor.isActive({ textAlign: "left" }) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          type="button"
          title="Căn trái"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-11 w-11 ${editor.isActive({ textAlign: "center" }) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          type="button"
          title="Căn giữa"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-11 w-11 ${editor.isActive({ textAlign: "right" }) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          type="button"
          title="Căn phải"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-11 w-11 ${editor.isActive({ textAlign: "justify" }) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          type="button"
          title="Căn đều"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Chèn Link & Ảnh */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className={`h-11 w-11 ${editor.isActive("link") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={addLink}
          ref={linkTrigger}
          type="button"
          title="Chèn Link"
          aria-label="Chèn liên kết"
          aria-haspopup="dialog"
          aria-expanded={isLinkDialogOpen}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <ImageInsertDialog
          onUploadingChange={onUploadingChange}
          open={isImageDialogOpen}
          onOpenChange={setImageDialogOpen}
          onInsert={(url) => editor.chain().focus().setImage({ src: url }).run()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-muted-foreground hover:text-foreground"
            type="button"
            title="Chèn Hình Ảnh"
            aria-label="Chèn hình ảnh"
          >
            <ImageIcon aria-hidden="true" className="h-4 w-4" />
          </Button>
        </ImageInsertDialog>
      </div>

      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Lịch sử */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 text-muted-foreground hover:text-foreground"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          type="button"
          title="Hoàn tác"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 text-muted-foreground hover:text-foreground"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          type="button"
          title="Làm lại"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isLinkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent onCloseAutoFocus={(event) => {
          event.preventDefault();
          linkTrigger.current?.focus();
        }}>
          <DialogHeader>
            <DialogTitle>Chèn liên kết</DialogTitle>
            <DialogDescription>Áp dụng địa chỉ cho phần văn bản đang chọn. Hủy giữ nguyên nội dung.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault();
            // Portals still bubble through React: never submit the PostForm.
            event.stopPropagation();
            insertLink();
          }}>
            <div className="space-y-2">
              <label htmlFor={linkInputId} className="text-sm font-medium">Địa chỉ liên kết</label>
              <Input id={linkInputId} value={linkUrl} autoComplete="off" inputMode="url"
                placeholder="https://…" aria-invalid={!!linkError}
                aria-describedby={linkError ? linkErrorId : undefined}
                onChange={(event) => { setLinkUrl(event.target.value); setLinkError(""); }} />
              {linkError ? <p id={linkErrorId} role="alert" className="text-sm text-destructive">{linkError}</p> : null}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setLinkDialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={!linkUrl.trim()}>Chèn liên kết</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export function RichTextEditor({ value, onChange, placeholder = "Nhập nội dung...", onUploadingChange }: RichTextEditorProps) {
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
          class: "rounded-md max-w-full h-auto mx-auto my-4",
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
          "tiptap prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[200px] sm:min-h-[300px] sm:max-h-[600px] sm:overflow-y-auto p-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="flex flex-col border border-input bg-background rounded-xl shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary overflow-hidden transition-[border-color,box-shadow] duration-150">
      <MenuBar editor={editor} onUploadingChange={onUploadingChange} />
      <EditorContent editor={editor} />
    </div>
  );
}
