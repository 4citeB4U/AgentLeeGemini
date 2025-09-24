declare const pdfjsLib: any;
declare const mammoth: any;
declare const XLSX: any;
declare const JSZip: any;

/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_FILE_PARSER
COLOR_ONION_HEX: NEON=#8B5CF6 FLUO=#7C3AED PASTEL=#DDD6FE
ICON_FAMILY: lucide
ICON_GLYPH: file-search
ICON_SIG: AL005001
5WH: WHAT=File parsing and content extraction utilities; WHY=Document processing and data extraction; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\utils\fileParser.ts; WHEN=2025-09-22; HOW=TypeScript utility functions for file processing
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

export interface ParsedFile {
    content: string;
    base64?: string;
    mimeType?: string;
}

export async function parseFile(file: File): Promise<ParsedFile> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        const getBase64 = (): Promise<string> => {
             return new Promise((resolveBase64) => {
                const b64Reader = new FileReader();
                b64Reader.onloadend = () => {
                    const url = b64Reader.result as string;
                    const [, base64Data] = url.split(',');
                    resolveBase64(base64Data);
                };
                b64Reader.readAsDataURL(file);
             });
        }
        
        // Handle Images and Videos for Media Analyzer
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            getBase64().then(base64 => {
                 resolve({
                    content: `File: ${file.name}\nSize: ${file.size} bytes`,
                    base64: base64,
                    mimeType: file.type,
                } as ParsedFile);
            });
            return;
        }

        // Handle PDF
        if (file.type === 'application/pdf') {
            reader.onload = async (event) => {
                try {
                    const loadingTask = pdfjsLib.getDocument(new Uint8Array(event.target?.result as ArrayBuffer));
                    const pdf = await loadingTask.promise;
                    let text = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        text += textContent.items.map((item: any) => item.str).join(' ');
                    }
                    resolve({ content: text });
                } catch (err) {
                    reject(new Error('Failed to parse PDF file.'));
                }
            };
            reader.readAsArrayBuffer(file);
            return;
        }

        // Handle DOCX
        if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
             reader.onload = async (event) => {
                try {
                    const result = await mammoth.extractRawText({ arrayBuffer: event.target?.result });
                    resolve({ content: result.value } as ParsedFile);
                } catch (err) {
                    reject(new Error('Failed to parse DOCX file.'));
                }
             };
             reader.readAsArrayBuffer(file);
             return;
        }

        // Handle XLSX
        if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
             reader.onload = async (event) => {
                try {
                    const workbook = XLSX.read(event.target?.result, { type: 'array' });
                    let text = '';
                    workbook.SheetNames.forEach((sheetName: string) => {
                        const worksheet = workbook.Sheets[sheetName];
                        text += XLSX.utils.sheet_to_csv(worksheet);
                    });
                    resolve({ content: text } as ParsedFile);
                } catch (err) {
                    reject(new Error('Failed to parse XLSX file.'));
                }
             };
             reader.readAsArrayBuffer(file);
             return;
        }
        
        // Handle ZIP
        if (file.type === 'application/zip') {
             reader.onload = async (event) => {
                try {
                    const zip = await JSZip.loadAsync(event.target?.result);
                    let content = `Archive contents of ${file.name}:\n\n`;
                    const fileList: string[] = [];
                    zip.forEach((relativePath) => {
                        fileList.push(`- ${relativePath}`);
                    });
                    content += fileList.join('\n');
                    resolve({ content });
                } catch (err) {
                     reject(new Error('Failed to read ZIP archive.'));
                }
             };
             reader.readAsArrayBuffer(file);
             return;
        }

        // Handle Text-based files
        if (file.type.startsWith('text/') || file.type === 'application/json' || file.name.match(/\.(js|ts|py|java|c|cpp|php|css|scss|jsx|tsx|html|xml|md)$/)) {
            reader.onload = (event) => {
                resolve({ content: event.target?.result as string } as ParsedFile);
            };
            reader.readAsText(file);
            return;
        }

        // Fallback for binary/unsupported files
        resolve({
            content: `File Name: ${file.name}\nFile Type: ${file.type}\nFile Size: ${file.size} bytes.\n\nThis file type cannot be read in the browser.`
        } as ParsedFile);
    });
};
