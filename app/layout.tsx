import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI \u4f60\u753b\u6211\u731c \u00b7 \u8fdb\u9636\u7248',
  description:
    '\u4f7f\u7528 llmxapi \u7684 Chat Completions \u63a5\u53e3\u9a71\u52a8\u7684 Next.js \u7f51\u9875\u5c0f\u6e38\u620f\uff0c\u81ea\u5df1\u51fa\u9898\u4f5c\u753b\uff0c\u5b9e\u65f6\u67e5\u770b AI \u7684\u731c\u6d4b\u4e0e\u804a\u5929\u8bb0\u5f55\u3002'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
