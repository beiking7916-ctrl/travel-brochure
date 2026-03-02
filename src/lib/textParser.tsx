import React from 'react';

/**
 * 解析特殊文字標記並回傳 React 元素：
 * **文字**：一般粗體
 * //文字//：系統色系粗體
 * [[文字|色碼]]：自訂顏色粗體
 */
export function parseRichText(text: string, themeColor: string) {
    if (!text) return null;

    const lines = text.split('\n');

    return (
        <>
            {lines.map((line, lineIndex) => {
                let currentString = line;
                const tokens: { type: string; content: string; color?: string }[] = [];

                while (currentString.length > 0) {
                    const customMatch = currentString.match(/\[\[(.*?)\|(.*?)\]\]/);
                    const boldMatch = currentString.match(/\*\*(.*?)\*\*/);
                    const themeMatch = currentString.match(/\/\/(.*?)\/\//);

                    const matches = [
                        { type: 'custom', match: customMatch },
                        { type: 'bold', match: boldMatch },
                        { type: 'theme', match: themeMatch }
                    ].filter(m => m.match).sort((a, b) => a.match!.index! - b.match!.index!);

                    if (matches.length === 0) {
                        tokens.push({ type: 'text', content: currentString });
                        break;
                    }

                    const firstMatch = matches[0];
                    const match = firstMatch.match!;

                    if (match.index! > 0) {
                        tokens.push({ type: 'text', content: currentString.substring(0, match.index) });
                    }

                    if (firstMatch.type === 'custom') {
                        tokens.push({ type: 'custom', content: match[1], color: match[2] });
                    } else if (firstMatch.type === 'bold') {
                        tokens.push({ type: 'bold', content: match[1] });
                    } else if (firstMatch.type === 'theme') {
                        tokens.push({ type: 'theme', content: match[1] });
                    }

                    currentString = currentString.substring(match.index! + match[0].length);
                }

                return (
                    <React.Fragment key={lineIndex}>
                        {tokens.map((token, i) => {
                            if (token.type === 'custom') return <strong key={i} style={{ color: token.color }}>{token.content}</strong>;
                            if (token.type === 'bold') return <strong key={i} className="font-bold text-gray-800">{token.content}</strong>;
                            if (token.type === 'theme') return <strong key={i} className="font-bold" style={{ color: themeColor }}>{token.content}</strong>;
                            return <span key={i}>{token.content}</span>;
                        })}
                        {lineIndex < lines.length - 1 && <br />}
                    </React.Fragment>
                );
            })}
        </>
    );
}
