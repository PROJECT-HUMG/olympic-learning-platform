import { useState, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { storageService } from "@/features/documents/services/storage.service";
import { toast } from "sonner";
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
  UploadCloud,
  Loader2,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface ImageInsertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string) => void;
}

function ImageInsertDialog({ open, onOpenChange, onInsert }: ImageInsertDialogProps) {
  const [tab, setTab] = useState("upload");
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Định dạng không hợp lệ", { description: "Vui lòng chọn tệp hình ảnh." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Tệp quá lớn", { description: "Kích thước ảnh tối đa là 5MB." });
      return;
    }

    try {
      setIsUploading(true);
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
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUrlInsert = () => {
    if (urlInput.trim()) {
      onInsert(urlInput.trim());
      setUrlInput("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chèn hình ảnh</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Tải lên từ máy</TabsTrigger>
            <TabsTrigger value="url">Đường dẫn URL</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-4">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-muted-foreground/25 cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors ${isUploading ? 'pointer-events-none bg-muted/30' : ''}`}
            >
              {isUploading ? (
                <div className="w-full space-y-4 px-4">
                  <div className="flex justify-center">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  </div>
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                      <span>Đang tải lên...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 w-full" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-primary/5 text-primary/70 rounded-full mb-3">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium">Nhấn để chọn ảnh</p>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    Hỗ trợ JPEG, PNG (Tối đa 5MB)
                  </p>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Input 
                placeholder="https://example.com/image.jpg" 
                value={urlInput} 
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlInsert()}
              />
            </div>
            <Button onClick={handleUrlInsert} className="w-full" disabled={!urlInput.trim()}>
              Chèn ảnh
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const [isImageDialogOpen, setImageDialogOpen] = useState(false);

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
    const url = window.prompt("URL:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    setImageDialogOpen(true);
  };

  return (
    <div className="flex items-center gap-2 border-b border-border p-2 bg-muted/20 rounded-t-md overflow-x-auto no-scrollbar scroll-smooth">
      
      {/* Kiểu chữ */}
      <div className="flex-shrink-0">
        <Select value={currentHeadingLevel} onValueChange={handleHeadingChange}>
          <SelectTrigger className="w-[140px] h-8 text-sm font-medium bg-background">
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
          className={`h-8 w-8 ${editor.isActive("bold") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
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
          className={`h-8 w-8 ${editor.isActive("italic") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
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
          className={`h-8 w-8 ${editor.isActive("underline") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          type="button"
          title="Gạch chân"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editor.isActive("strike") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
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
          className={`h-8 w-8 ${editor.isActive("bulletList") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          type="button"
          title="Danh sách dấu chấm"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editor.isActive("orderedList") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          type="button"
          title="Danh sách số"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editor.isActive("blockquote") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
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
          className={`h-8 w-8 ${editor.isActive({ textAlign: "left" }) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          type="button"
          title="Căn trái"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editor.isActive({ textAlign: "center" }) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          type="button"
          title="Căn giữa"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editor.isActive({ textAlign: "right" }) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          type="button"
          title="Căn phải"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editor.isActive({ textAlign: "justify" }) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
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
          className={`h-8 w-8 ${editor.isActive("link") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={addLink}
          type="button"
          title="Chèn Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={addImage}
          type="button"
          title="Chèn Hình Ảnh"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Lịch sử */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          type="button"
          title="Làm lại"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <ImageInsertDialog 
        open={isImageDialogOpen} 
        onOpenChange={setImageDialogOpen} 
        onInsert={(url) => editor.chain().focus().setImage({ src: url }).run()} 
      />
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
          "prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[300px] max-h-[600px] overflow-y-auto p-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="flex flex-col border border-input bg-background rounded-xl shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary overflow-hidden transition-all duration-200">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
