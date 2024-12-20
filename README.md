# Carbon pattern code generator

This is a CLI tool used to generate example code for identified patterns within the Carbon Design System.

The majority of the current examples are created from pre-existing Vite templates from a monorepo to demonstrate how to use `@carbon/react` and `@tanstack/react-table` together. You can choose to either generate a full Vite application or to generate an inline example within an existing application.

## Usage

```bash
npx @carbon/generate-pattern
```

1. Select a pattern
   ![Usage screenshot](/assets/gen-pattern-usage.png)
2. Choose if you want the pattern's dependencies installed
   ![Install dependencies step](/assets/install-deps.png)
3. Choose an install path (default is current directory)
   ![Install path step](/assets/install-path.png)
4. Select pattern type

- Full example app
- Integrate within an existing app, ie inline
  ![Pattern type](/assets/pattern_type.png)
