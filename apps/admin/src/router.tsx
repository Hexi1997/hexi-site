import { createBrowserRouter } from "react-router-dom";
import { Layout } from "@/components/layout";
import { BlogListPage } from "@/pages/blog-list-page";
import { BlogEditorPage } from "@/pages/blog-editor-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <BlogListPage />,
      },
      {
        path: "editor/:slug",
        element: <BlogEditorPage />,
      },
    ],
  },
]);
