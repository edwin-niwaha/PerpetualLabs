import Markdown from "react-markdown";
export function JournalMarkdown({ children }: { children: string }) {
  return (
    <div className="journal-prose">
      <Markdown
        skipHtml
        components={{
          img: ({ alt }) => <span className="muted">{alt}</span>,
          a: ({ href, children }) => (
            <a href={href} rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
