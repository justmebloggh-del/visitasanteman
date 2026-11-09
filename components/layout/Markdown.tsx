import ReactMarkdown from "react-markdown";

/** react-markdown does not render raw HTML by default, so editor content cannot inject scripts. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-vlb">
      <ReactMarkdown
        components={{
          a: ({ href, children: c }) => {
            const external = /^https?:\/\//.test(href ?? "");
            const ok = external || (href ?? "").startsWith("/") || (href ?? "").startsWith("#") || (href ?? "").startsWith("mailto:");
            return ok ? <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{c}</a> : <span>{c}</span>;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
