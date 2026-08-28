import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote/rsc";
import { expect, it } from "vitest";

it("renders the John Resig photo credit as one flowing caption", async () => {
  const source = readFileSync("content/posts/jquery-compatibility-layer-shaped-web.mdx", "utf8");
  const { content } = matter(source);
  const markup = renderToStaticMarkup(await MDXRemote({ source: content }));
  const container = document.createElement("div");
  container.innerHTML = markup;

  const caption = container.querySelector("figcaption");

  expect(caption).not.toBeNull();
  expect(caption).toHaveTextContent(
    "John Resig speaking at JSConf US in April 2010. Photo by JS Conf, resized from the original, via Wikimedia Commons and licensed CC BY 2.0.",
  );
  expect(caption?.querySelector("p")).toBeNull();
});
