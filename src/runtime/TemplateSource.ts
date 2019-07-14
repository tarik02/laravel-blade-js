export interface TemplateSource {
  /**
   * @param name The name of the template
   * @return {Promise<string>} Compiled template content
   */
  getTemplateCompiledFile(name: string): Promise<string | undefined>;
}
