const { EleventyHtmlBasePlugin } = require('@11ty/eleventy')
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight")

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin)
  eleventyConfig.addPlugin(syntaxHighlight)

  return {
    pathPrefix: '/twelvety/',
    dir: {
      input: 'src',
      includes: '_includes',
      output: 'dist',
    },
    templateFormats: ['md', 'njk', 'html'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
  }
}

