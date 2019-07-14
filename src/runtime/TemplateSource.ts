import { CompiledTemplate } from './Runtime';

export interface TemplateSource {
  /**
   * @param name The name of the template
   * @return {Promise<CompiledTemplate | undefined>} Compiled template content or undefined if not found
   */
  getTemplateCompiledFile(name: string): Promise<CompiledTemplate | undefined>;

  /**
   * @param name The name of the template
   * @param template The result of corresponding {getTemplateCompiledFile} call
   * @param creationTime The time of corresponding {getTemplateCompiledFile} call
   * @return Whether the template is already outdated
   */
  isOutdated(name: string, template: CompiledTemplate, creationTime: number): Promise<boolean>;
}
