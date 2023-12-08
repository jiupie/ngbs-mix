const lightCodeTheme = require('prism-react-renderer/themes/github')
const darkCodeTheme = require('prism-react-renderer/themes/dracula')

// With JSDoc @type annotations, IDEs can provide config autocompletion
/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: '南顾北衫-mix',
  tagline: '南顾北衫-mix',
  url: 'https://jiupie.github.io',
  baseUrl: '/ngbs-mix/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'jiupie', // Usually your GitHub org/user name.
  projectName: 'ngbs-mix', // Usually your repo name.
  trailingSlash: false,
  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/jiupie/ngbs-mix'
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl: 'https://github.com/jiupie/ngbs-mix/blog/'
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css')
        }
      }
    ]
  ],

  /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
  themeConfig: {
    navbar: {
      title: '南顾北衫-mix',
      logo: {
        alt: '南顾北衫-mix',
        src: 'img/logo.svg'
      },
      items: [
        {
          label: 'Spring解读',
          position: 'left',
          to: 'docs/spring/事件监听机制'
        },
        {
          label: '工具',
          position: 'left',
          to: 'docs/tools/intro'
        }
      ]
    },
    footer: {
      style: 'dark',
      links: [],
      copyright: `Copyright © ${new Date().getFullYear()} 南顾北衫, Inc. Built with Docusaurus.`
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
      additionalLanguages: [
        'powershell',
        'java',
        'rust',
        'xml-doc',
        'yaml',
        'sql',
        'c',
        'cpp',
        'cmake',
        'javascript',
        'shell-session',
        'bash'
      ]
    }
  }
}
