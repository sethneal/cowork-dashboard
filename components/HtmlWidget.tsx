type Props = { content: string }

export function HtmlWidget({ content }: Props) {
  return (
    <div
      className="prose prose-sm max-w-none text-gray-700"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
