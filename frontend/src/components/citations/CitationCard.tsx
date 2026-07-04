type Props = { page: number; snippet: string };

export default function CitationCard({ page, snippet }: Props) {
  return <div className="citation">Page {page}: {snippet}</div>;
}
