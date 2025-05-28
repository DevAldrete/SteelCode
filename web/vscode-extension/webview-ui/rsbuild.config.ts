import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  output: {
    // Ensures CSS and JS are output in a way that's easier for webviews
    assetPrefix: './', 
  }
});
