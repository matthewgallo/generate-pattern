export const config = {
  branches: ['main'],
  plugins: [
    ['@semantic-release/commit-analyzer', {
      'preset': 'conventionalcommits',
      'releaseRules': [
          { 'type': 'docs', 'scope': 'README', 'release': 'minor' },
          { 'type': 'refactor', 'release': 'minor' },
          { 'type': 'style', 'release': 'minor' },
          { 'type': 'chore', 'release': 'minor' },
          { 'type': 'fix', 'release': 'minor' },
          { 'type': 'feat', 'release': 'minor' },
        ],
        'parserOpts': {
          'noteKeywords': ['BREAKING CHANGE', 'BREAKING CHANGES']
        }
    }],
    '@semantic-release/release-notes-generator',
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "CHANGELOG.md"
      }
    ],
    ["@semantic-release/git", {
      "assets": [
        "CHANGELOG.md",
        "dist/**",
        "package.json",
      ],
      "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
    }],
    '@semantic-release/github'
  ]
};
