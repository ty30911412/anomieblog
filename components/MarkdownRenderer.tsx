'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

// 擴展 sanitize schema，允許 SVG 元素與屬性
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'svg', 'g', 'rect', 'circle', 'line', 'path', 'text', 'tspan',
    'polyline', 'polygon', 'defs', 'clipPath', 'use', 'title',
  ],
  attributes: {
    ...defaultSchema.attributes,
    svg: ['viewBox', 'width', 'height', 'xmlns', 'aria-label', 'role'],
    g: ['transform', 'fill', 'stroke', 'opacity'],
    rect: ['x', 'y', 'width', 'height', 'fill', 'stroke', 'rx', 'ry', 'opacity'],
    circle: ['cx', 'cy', 'r', 'fill', 'stroke', 'opacity'],
    line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'strokeWidth', 'stroke-width', 'opacity', 'strokeDasharray', 'stroke-dasharray'],
    path: ['d', 'fill', 'stroke', 'strokeWidth', 'stroke-width', 'opacity'],
    text: ['x', 'y', 'fill', 'fontSize', 'font-size', 'fontFamily', 'font-family', 'textAnchor', 'text-anchor', 'dominantBaseline', 'dominant-baseline', 'fontWeight', 'font-weight', 'opacity'],
    tspan: ['x', 'y', 'dx', 'dy', 'fill', 'fontSize', 'font-size'],
    polyline: ['points', 'fill', 'stroke', 'strokeWidth', 'stroke-width'],
    polygon: ['points', 'fill', 'stroke', 'strokeWidth', 'stroke-width'],
  },
}

interface Props {
  content: string
}

// 將標題文字轉成與 TOC 一致的 id
function slugify(text: string): string {
  return text
    .replace(/\*\*|__|\*|_|`/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\w一-龥\s-]/g, '')
    .replace(/\s+/g, '-')
}

const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  return (
    <div className="prose prose-stone max-w-none text-ink-800 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={{
          // 標題加上 id，讓 TOC anchor 能跳轉
          h1: ({ node, children, ...props }) => (
            <h1 id={slugify(String(children))} className="scroll-mt-24" {...props}>{children}</h1>
          ),
          h2: ({ node, children, ...props }) => (
            <h2 id={slugify(String(children))} className="scroll-mt-24" {...props}>{children}</h2>
          ),
          h3: ({ node, children, ...props }) => (
            <h3 id={slugify(String(children))} className="scroll-mt-24" {...props}>{children}</h3>
          ),
          // 圖片：加上 data-lightbox 屬性，讓 ImageLightbox 可以偵測
          img: ({ node, src, alt, ...props }) => (
            <img
              src={src}
              alt={alt}
              data-lightbox="true"
              className="rounded-lg shadow-sm border border-ink-100 my-6 max-h-[500px] w-full object-cover mx-auto cursor-zoom-in"
              loading="lazy"
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              {...props}
              className="text-amber-700 font-bold hover:text-amber-900 hover:underline transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              {...props}
              className="border-l-4 border-amber-500 pl-4 py-1 my-6 bg-amber-50/50 italic text-ink-700 rounded-r-lg"
            />
          ),
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match && !String(children).includes('\n')
            return isInline ? (
              <code {...props} className="bg-ink-100 text-amber-800 px-1.5 py-0.5 rounded text-sm font-mono font-bold">
                {children}
              </code>
            ) : (
              <code {...props} className={className}>{children}</code>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
