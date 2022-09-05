# YFM Webpack builder

Research:
- Use webpack as core tech for builder
- Skip webpack on production (yfm-loader-runner as replacement of webpack)
- Unified as core tech for transformations
- Micro transformers. User combines transformers, not transformer flags.
- Transformers for all (toc, md, leading, bundle)
- Webpack effective cache
- Md to md transformation.
Problem: markdown-it transforms md to html only.
This requires us to copy parts of md processing from yfm-docs to docs-viewer.

### Join to research
```bash
git clone git@github.com:3y3/yfm-webpack-builder.git
git clone git@github.com:3y3/yfm-loader-runner.git

(cd yfm-loader-runner; npm i)
cd yfm-webpack-builder; npm i;

npm run run # or npm run build
```