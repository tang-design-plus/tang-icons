import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { emptyDir, ensureDir } from "fs-extra";
import camelcase from "camelcase";
import glob from "fast-glob";
import { format } from "prettier";
import { pathComponents, pathSvg, pathTypes } from "./paths";
import { defineConfig } from "vite";

// 遍历svg 目录
const getSvgFiles = async () => glob("*.svg", { cwd: pathSvg, absolute: true });

const getName = (file: string) => {
  const filename = path.basename(file).replace(".svg", "");
  const componentName = camelcase(filename, { pascalCase: true });
  return {
    filename,
    componentName,
  };
};
const formatCode = (code: string, parser = "typescript") =>
  format(code, {
    parser,
    semi: false,
    singleQuote: true,
  });

const transformToVueComponent = async (file: string) => {
  const content = await readFile(file, "utf-8");
  const { filename, componentName } = getName(file);
  const pathArr = content.match(/<path(.*?)>/gi) || []
  const newPaths = pathArr.map((item, idx) => {
    return item.replace(
      /<path([\S\s]*?)fill="(.*?)"([\S\s]*?)>/g,
      `<path$1fill="$\{this.colors?.[${idx}]||'$2'}"$3>`
    )
  })
  const lit = formatCode(
    `
  import { LitElement, html, css} from 'lit'
  import { customElement, property} from 'lit/decorators.js'
  @customElement('t-${filename}')
  export class ${componentName} extends LitElement {
    @property({
      type:String,
      converter: (attrValue: String | null) => {
        if (attrValue)
          return attrValue.split(',');
        else
          return  undefined;
      }
    })
    colors?: String[];
    render() {
      return html\`
      <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      ${newPaths.join('')}
      </svg>
        \`
      }
      static styles=css\`:host{
        display:inline-flex;
      }svg{
        width:1em;height:1em
      }
      \`
    }
    declare global {
      interface HTMLElementTagNameMap {
        't-${filename}': ${componentName}
      }
    }
        `
  );
  // types
  const types=`
  import { LitElement, CSSResultGroup } from 'lit';
  export declare class ${componentName} extends LitElement {
    colors?: string[];
    render(): import("lit").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
declare global {
    interface HTMLElementTagNameMap {
        't-${filename}': ${componentName};
    }
}
  `
  // 写入文件
  writeFile(path.resolve(pathComponents, `${filename}.ts`), lit, "utf-8");
  writeFile(path.resolve(pathTypes, `${filename}.d.ts`), types, "utf-8");
  
};
const generateEntry = async (files: string[]) => {
  const code = formatCode(
    files
      .map((file) => {
        const { filename, componentName } = getName(file);
        return `export { ${componentName} } from './${filename}'`;
      })
      .join("\n")
  );
  await writeFile(path.resolve(pathComponents, "index.ts"), code, "utf-8");
  await writeFile(path.resolve(pathTypes, "index.d.ts"), code, "utf-8");
};

export default defineConfig(async () => {
  await ensureDir(pathComponents);
  await emptyDir(pathComponents);
  const files = await getSvgFiles();
  await Promise.all(files.map((file) => transformToVueComponent(file)));

  await generateEntry(files);

  return {
    build: {
      lib: {
        entry: "src/components/index.ts",
        name:'TangIcons',
        formats: ["es",'umd']
      },
      rollupOptions: {
        external: /^lit/,
      },
    },
  };
});
