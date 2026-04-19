"use client";

import { 
  MDXEditor, 
  headingsPlugin, 
  listsPlugin, 
  quotePlugin, 
  thematicBreakPlugin, 
  markdownShortcutPlugin, 
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ListsToggle,
  UndoRedo,
  imagePlugin,
  linkPlugin,
  linkDialogPlugin,
  CreateLink,
  InsertImage,
  MDXEditorMethods
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { useRef } from 'react';
import { uploadFile } from "@/utils/supabase";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const editorRef = useRef<MDXEditorMethods>(null);

  /**
   * The editor needs to upload images immediately when inserted 
   * to get a URL to display in the markdown.
   */
  async function imageUploadHandler(image: File) {
    try {
      const url = await uploadFile(image, "editor");
      return url;
    } catch (err: any) {
      console.error("Markdown Editor upload error:", err);
      return "";
    }
  }

  return (
    <div className="border border-input rounded-md overflow-hidden bg-white min-h-[300px] flex flex-col prose prose-sm max-w-none">
      <MDXEditor
        ref={editorRef}
        markdown={value}
        onChange={onChange}
        placeholder={placeholder}
        contentEditableClassName="min-h-[250px] p-4 focus:outline-none"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          imagePlugin({
            imageUploadHandler,
          }),
          toolbarPlugin({
            toolbarContents: () => (
              <div className="flex flex-wrap items-center gap-1 p-1 bg-gray-50 border-b border-input w-full">
                <UndoRedo />
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <BlockTypeSelect />
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <BoldItalicUnderlineToggles />
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <ListsToggle />
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <CreateLink />
                <InsertImage />
              </div>
            )
          })
        ]}
      />
    </div>
  );
}
