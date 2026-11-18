import LlamaCloud, { toFile } from '@llamaindex/llama-cloud';
import {
  assessExtractionQuality,
  countWords,
  toNodeBuffer,
  type DocumentParser,
  type DocumentParserInput,
  type ParsedDocument,
} from './types';

type LlamaParseMode = 'off' | 'fallback' | 'force';

export class LlamaParseParser implements DocumentParser {
  constructor(
    private readonly options: {
      mimeType?: string;
      mode: LlamaParseMode;
      fallbackUsed: boolean;
      localParser?: string;
      warnings?: string[];
    },
  ) {}

  async parse(buffer: DocumentParserInput, filename: string): Promise<ParsedDocument> {
    const apiKey = process.env.LLAMAPARSE_API_KEY || process.env.LLAMA_CLOUD_API_KEY;

    if (!apiKey) {
      throw new Error('LlamaParse is enabled but LLAMAPARSE_API_KEY is not configured.');
    }

    const nodeBuffer = toNodeBuffer(buffer);
    const client = new LlamaCloud({
      apiKey,
      timeout: 5 * 60 * 1000,
    });

    const uploadFile = await toFile(nodeBuffer, filename, {
      type: this.options.mimeType || 'application/octet-stream',
    });

    const result = await client.parsing.parse(
      {
        upload_file: uploadFile,
        tier: 'cost_effective',
        version: 'latest',
        client_name: 'springvox-knowledge-ai',
        expand: ['markdown', 'text', 'metadata', 'job_metadata'],
        output_options: {
          markdown: {
            tables: {
              output_tables_as_markdown: true,
              compact_markdown_tables: true,
            },
          },
        },
      },
      {
        timeout: 10 * 60 * 1000,
      },
    );

    const markdown = typeof result.markdown_full === 'string' ? result.markdown_full.trim() : '';
    const text = typeof result.text_full === 'string' ? result.text_full.trim() : '';
    const extractedText = markdown || text;

    if (!extractedText) {
      throw new Error('No readable text could be extracted from this document by LlamaParse.');
    }

    const pageCount =
      Array.isArray(result.markdown?.pages)
        ? result.markdown.pages.length
        : Array.isArray(result.text?.pages)
          ? result.text.pages.length
          : undefined;

    return {
      text: extractedText,
      metadata: {
        parser: 'llamaparse',
        parser_used: 'llamaparse',
        parser_mode: this.options.mode,
        llama_parse_job_id: result.job?.id,
        local_parser_used: this.options.localParser,
        fallback_used: this.options.fallbackUsed,
        extraction_quality: assessExtractionQuality(extractedText, nodeBuffer.byteLength),
        fallbackUsed: this.options.fallbackUsed,
        extractedFormat: markdown ? 'markdown' : 'text',
        localParser: this.options.localParser,
        llamaParseJobId: result.job?.id,
        llamaParseMode: this.options.mode,
        pageCount,
        wordCount: countWords(extractedText),
        warnings: this.options.warnings,
      },
    };
  }
}
