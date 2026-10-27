# Changelog entry

`CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and [SemVer](https://semver.org/). Tags have no `v` prefix.

While work is in progress, add bullets under `## [Unreleased]`. At release,
rename that block to `## [X.Y.Z] - YYYY-MM-DD`, leave an empty
`## [Unreleased]` above it, add a one-line summary under the version heading,
and append a compare link at the bottom:

```
[X.Y.Z]: https://github.com/ericscaglioni/iBudget/compare/PREVIOUS...X.Y.Z
```

Write for the user. Say what they can do, or what stopped going wrong — not
the function you renamed.

## Unreleased (copy into CHANGELOG.md)

```markdown
## [Unreleased]

### Added
- …

### Changed
- …

### Fixed
- …

### Removed
- …
```

Leave out empty sections. If the change includes a database migration, say so
in the bullet (the column or table, and that it runs on deploy).

## Released version (at ship time)

```markdown
## [X.Y.Z] - YYYY-MM-DD

One short sentence of what this version is about.

### Added
- …

### Fixed
- …
```
