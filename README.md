# NodeCG Bundler

## What is it?

NodeCG-Bundler is a wrapper around Vite that makes it super easy to bundle your NodeCG bundles.

## Installation

```bash
# npm
npm install --save-dev nodecg-bundler
# or yarn
yarn add --dev nodecg-bundler
```

## Usage

In your package.json file, add the following to your scripts section:

```json
"scripts": {
  "build": "nodecg-bundler build",
  "dev": "nodecg-bundler watch"
}
```

Then, just follow the same steps as you would with Vite to build your bundles.
