import { CompiledTemplate } from './CompiledTemplate';

export interface TemplateProvider {
  /**
   * This function should return async generator function which yields chunks of text.
   * The returned function gets only one argument - {Environment}.
   *
   * @param name The name of the template
   * @return {Promise<CompiledTemplate | undefined>} Compiled template content or undefined if not found
   */
  getTemplateCompiledFile(name: string): Promise<CompiledTemplate | undefined>;

  /**
   * @param name The name of the template
   * @param template The result of corresponding {getTemplateCompiledFile} call
   * @param creationTime The time (Date.now) of corresponding {getTemplateCompiledFile} call
   * @return Whether the template is already outdated
   */
  isOutdated(name: string, template: CompiledTemplate, creationTime: number): Promise<boolean>;
}
