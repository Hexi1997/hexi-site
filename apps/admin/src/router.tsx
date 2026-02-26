import { createBrowserRouter } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { BlogListPage } from "@/pages/BlogListPage";
import { BlogEditorPage } from "@/pages/BlogEditorPage";

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
