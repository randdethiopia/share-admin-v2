"use client";

import React from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css"; // The 'Snow' theme CSS

// 1. THE SENIOR MOVE: Load Quill ONLY on the client side
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full bg-gray-50 animate-pulse rounded-xl" />,
});

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function Editor({ value, onChange }: EditorProps) {
  // 2. Define the Toolbar options to match your screenshot
  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  };

  return (
    <div className="bg-white">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        className="rounded-xl overflow-hidden"
        placeholder="Write your description here..."
      />
      
      {/* 3. SENIOR STYLING: Custom CSS to make it look like your screenshot */}
      <style jsx global>{`
        .ql-container {
          min-height: 250px;
          font-size: 16px;
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
        }
        .ql-toolbar {
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          background-color: #f9fafb;
        }
      `}</style>
    </div>
  );
}