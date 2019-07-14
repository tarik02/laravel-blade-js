import { CompiledTemplate } from './Runtime';

export interface TemplateSource {
  /**
   * @param name The name of the template
   * @return {Promise<CompiledTemplate | undefined>} Compiled template content or undefined if not found
   */
  getTemplateCompiledFile(name: string): Promise<CompiledTemplate | undefined>;
}
