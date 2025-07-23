#!/usr/bin/env node

import fs from 'fs/promises';
import { rmSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Allowed image extensions to copy into public folder
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);

function isImageFile(name) {
  return IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase());
}

function humanize(name) {
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Utility to get ordered directory entries based on metadata.json if present
async function getOrderedDirs(dir, filterFn) {
  let entries = await fs.readdir(dir, { withFileTypes: true });
  entries = entries.filter(filterFn);
  let metadata = null;
  try {
    const metadataPath = path.join(dir, 'metadata.json');
    const metadataJson = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
    if (Array.isArray(metadataJson.items)) {
      metadata = metadataJson;
    }
  } catch (e) {
    // No metadata.json or invalid, ignore
  }
  if (!metadata || metadata.items.length === 0) return entries;
  
  // Map entries by name for fast lookup
  const entryMap = Object.fromEntries(entries.map(e => [e.name, e]));
  
  // Filter items to only include those that should be compiled (compile: true or undefined)
  const compileItems = metadata.items.filter(item => item.compile !== false);
  
  // Ordered entries from metadata.json
  const ordered = compileItems.map(item => entryMap[item.name]).filter(Boolean);
  
  // Remaining entries not in metadata.json, sorted alphabetically
  const remaining = entries.filter(e => !metadata.items.some(item => item.name === e.name)).sort((a, b) => a.name.localeCompare(b.name));
  
  return [...ordered, ...remaining];
}

// Utility to get ordered file entries based on metadata.json if present
async function getOrderedFiles(dir, filterFn) {
  let entries = await fs.readdir(dir, { withFileTypes: true });
  entries = entries.filter(filterFn);
  let metadata = null;
  try {
    const metadataPath = path.join(dir, 'metadata.json');
    const metadataJson = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
    if (Array.isArray(metadataJson.items)) {
      metadata = metadataJson;
    }
  } catch (e) {
    // No metadata.json or invalid, ignore
  }
  if (!metadata || metadata.items.length === 0) return entries;
  
  // Map entries by name for fast lookup
  const entryMap = Object.fromEntries(entries.map(e => [e.name, e]));
  
  // Filter items to only include those that should be compiled (compile: true or undefined)
  const compileItems = metadata.items.filter(item => item.compile !== false);
  
  // Ordered entries from metadata.json
  const ordered = compileItems.map(item => entryMap[item.name]).filter(Boolean);
  
  // Remaining entries not in metadata.json, sorted alphabetically
  const remaining = entries.filter(e => !metadata.items.some(item => item.name === e.name)).sort((a, b) => a.name.localeCompare(b.name));
  
  return [...ordered, ...remaining];
}

async function generate() {
  const root = process.cwd();
  const latexDir = path.join(root, 'latex');
  const pagesDir = path.join(root, 'src', 'pages');
  // Output generated HTML into src/content to avoid route collisions under pages
  const contentDirRoot = path.join(root, 'src', 'content');

  const sections = await fs.readdir(latexDir, { withFileTypes: true });
  for (const section of sections.filter(d => d.isDirectory())) {
    const sectionName = section.name;
    const sectionLatex = path.join(latexDir, sectionName);
    const sectionPages = path.join(pagesDir, sectionName);
    const sectionContentDir = path.join(contentDirRoot, sectionName);
    await fs.mkdir(sectionContentDir, { recursive: true });

    // Clean existing topic folders, keep only index.astro
    await fs.mkdir(sectionPages, { recursive: true });
    const existing = await fs.readdir(sectionPages);
    for (const name of existing) {
      if (name !== 'index.astro') {
        rmSync(path.join(sectionPages, name), { recursive: true, force: true });
      }
    }

    // Use getOrderedDirs for topics
    const topics = await getOrderedDirs(sectionLatex, d => d.isDirectory());
    const indexItems = [];

    for (const topicDir of topics) {
      const topicName = topicDir.name;
      const topicLatex = path.join(sectionLatex, topicName);
      const topicPages = path.join(sectionPages, topicName);
      const topicContentDir = path.join(sectionContentDir, topicName);
      await fs.mkdir(topicContentDir, { recursive: true });
      await fs.mkdir(topicPages, { recursive: true });

      // Gather entries in the topic directory
      const entries = await fs.readdir(topicLatex, { withFileTypes: true });
      const texFileEntries = await getOrderedFiles(topicLatex, e => e.isFile() && e.name.endsWith('.tex'));
      const texFiles = texFileEntries.map(e => e.name);
      const subdirs = await getOrderedDirs(topicLatex, e => e.isDirectory());

      // Copy non-.tex assets (e.g., images) to the public folder for this topic
      const publicTopicDir = path.join(root, 'public', sectionName, topicName);
      await fs.mkdir(publicTopicDir, { recursive: true });
      for (const entry of entries) {
        if (entry.isFile() && isImageFile(entry.name)) {
          const srcFile = path.join(topicLatex, entry.name);
          await fs.copyFile(srcFile, path.join(publicTopicDir, entry.name));
        }
      }

      // CASE 1: Single .tex file and no subdirectories → treat as a single topic page
      if (texFiles.length === 1 && subdirs.length === 0) {
        const file = texFiles[0];
        const base = path.parse(file).name;
        const texPath = path.join(topicLatex, file);
        const outputHtml = path.join(topicContentDir, 'content.html');
        console.log(`Generating HTML for ${texPath} → ${outputHtml}`);
        execSync(
          `pandoc "${texPath}" -s --katex --section-divs --lua-filter=latex/filter.lua --css=style.css -o "${outputHtml}"`,
          { stdio: 'inherit' }
        );
        // Rewrite image URLs in content.html to absolute public paths
        let html = await fs.readFile(outputHtml, 'utf-8');
        html = html.replace(/(<img[^>]*src=")(?!\/)([^"]+)(")/g,
          `$1/${sectionName}/${topicName}/$2$3`
        );
        await fs.writeFile(outputHtml, html);

        // Create or overwrite index.astro for this topic
        const title = humanize(base);
        const rawSectionTitle = sectionName === 'cs'
          ? 'Computer Science Notes'
          : `${capitalize(sectionName)} Notes`;
        const indexAstro = `---
import NoteLayout from '../../../layouts/NoteLayout.astro';
import content from '../../../content/${sectionName}/${topicName}/content.html?raw';

const sectionName = '${sectionName}';
const sectionTitle = '${rawSectionTitle}';
const title = '${title}';
const sidebarItems = [];
---

<NoteLayout sectionName={sectionName} sectionTitle={sectionTitle} title={title} sidebarItems={sidebarItems}>
  <div class="latex-notes" set:html={content} />
</NoteLayout>
`;
        await fs.writeFile(path.join(topicPages, 'index.astro'), indexAstro);
        indexItems.push({ title: humanize(topicName), href: `/${sectionName}/${topicName}` });
        continue; // Skip to next topic
      }

      // CASE 2: Multiple .tex files or subdirectories → subtopic navigation
      // Get ordered list of all items (both .tex files and subdirectories)
      let metadata = null;
      try {
        const metadataPath = path.join(topicLatex, 'metadata.json');
        const metadataJson = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
        if (Array.isArray(metadataJson.items)) {
          metadata = metadataJson;
        }
      } catch (e) {
        // No metadata.json or invalid, ignore
      }

      // Create a map of all available items
      const allItems = new Map();
      
      // Add .tex files to the map
      for (const file of texFiles) {
        const base = path.parse(file).name;
        allItems.set(base, { type: 'tex', file, base });
      }
      
      // Add subdirectories to the map
      for (const subDir of subdirs) {
        const subName = subDir.name;
        allItems.set(subName, { type: 'dir', subDir, subName });
      }

      // Process items in the specified order, then remaining items alphabetically
      const subtopicItems = [];
      const processedItems = new Set();
      
      // Process items in metadata.json first (only those that should be compiled)
      if (metadata && metadata.items.length > 0) {
        const compileItems = metadata.items.filter(item => item.compile !== false);
        for (const metadataItem of compileItems) {
          const itemName = metadataItem.name;
          const allItem = allItems.get(itemName);
          if (allItem) {
            if (allItem.type === 'tex') {
              // Process .tex file
              const { file, base } = allItem;
              const texPath = path.join(topicLatex, file);
              const subPages = topicPages;
              const outputHtml = path.join(topicContentDir, `${base}.html`);
              console.log(`Generating HTML for ${texPath} → ${outputHtml}`);
              execSync(
                `pandoc "${texPath}" -s --katex --section-divs --lua-filter=latex/filter.lua --css=style.css -o "${outputHtml}"`,
                { stdio: 'inherit' }
              );
              let html = await fs.readFile(outputHtml, 'utf-8');
              html = html.replace(/(<img[^>]*src=")(?!\/)([^"]+)(")/g,
                `$1/${sectionName}/${topicName}/$2$3`
              );
              await fs.writeFile(outputHtml, html);
              
              const title = humanize(base);
              const rawSectionTitle = sectionName === 'cs'
                ? 'Computer Science Notes'
                : `${capitalize(sectionName)} Notes`;
            const subAstro = `---
import NoteLayout from '../../../layouts/NoteLayout.astro';
import content from '../../../content/${sectionName}/${topicName}/${base}.html?raw';

const sectionName = '${sectionName}';
const sectionTitle = '${rawSectionTitle}';
const topicName = '${topicName}';
const topicTitle = '${humanize(topicName)}';
const title = '${title}';
const sidebarItems = [];
---

<NoteLayout sectionName={sectionName} sectionTitle={sectionTitle} topicName={topicName} topicTitle={topicTitle} title={title} sidebarItems={sidebarItems}>
  <div class="latex-notes" set:html={content} />
</NoteLayout>
`;
              await fs.writeFile(path.join(subPages, `${base}.astro`), subAstro);
              subtopicItems.push({ title, href: `/${sectionName}/${topicName}/${base}` });
            } else if (allItem.type === 'dir') {
              // Process subdirectory
              const { subDir, subName } = allItem;
              const subLatex = path.join(topicLatex, subName);
              const subPages = path.join(topicPages, subName);
              // Prepare corresponding content directory to avoid html pages under src/pages
              const subContentDir = path.join(topicContentDir, subName);
              await fs.mkdir(subContentDir, { recursive: true });
              await fs.mkdir(subPages, { recursive: true });
              
              const subEntries = await fs.readdir(subLatex, { withFileTypes: true });
              await fs.mkdir(path.join(publicTopicDir, subName), { recursive: true });
              for (const entry of subEntries) {
                if (entry.isFile() && isImageFile(entry.name)) {
                  const srcFile = path.join(subLatex, entry.name);
                  await fs.copyFile(srcFile, path.join(publicTopicDir, subName, entry.name));
                }
              }
              
              const subTexFileEntries = await getOrderedFiles(subLatex, e => e.isFile() && e.name.endsWith('.tex'));
              const subTexFiles = subTexFileEntries.map(e => e.name);
              for (const file of subTexFiles) {
                const base = path.parse(file).name;
                const texPath = path.join(subLatex, file);
                const outputHtml = path.join(subContentDir, 'content.html');
                console.log(`Generating HTML for ${texPath} → ${outputHtml}`);
                execSync(
                  `pandoc "${texPath}" -s --katex --section-divs --lua-filter=latex/filter.lua --css=style.css -o "${outputHtml}"`,
                  { stdio: 'inherit' }
                );
                let html = await fs.readFile(outputHtml, 'utf-8');
                html = html.replace(/(<img[^>]*src=")(?!\/)([^"]+)(")/g,
                  `$1/${sectionName}/${topicName}/${subName}/$2$3`
                );
                await fs.writeFile(outputHtml, html);
                
                const title = humanize(base);
                const rawSectionTitle = sectionName === 'cs'
                  ? 'Computer Science Notes'
                  : `${capitalize(sectionName)} Notes`;
                const subAstro = `---
import NoteLayout from '../../../../layouts/NoteLayout.astro';
import content from '../../../../content/${sectionName}/${topicName}/${subName}/content.html?raw';

const sectionName = '${sectionName}';
const sectionTitle = '${rawSectionTitle}';
const topicName = '${topicName}';
const topicTitle = '${humanize(topicName)}';
const title = '${title}';
const sidebarItems = [];
---

<NoteLayout sectionName={sectionName} sectionTitle={sectionTitle} topicName={topicName} topicTitle={topicTitle} title={title} sidebarItems={sidebarItems}>
  <div class="latex-notes" set:html={content} />
</NoteLayout>
`;
                await fs.writeFile(path.join(subPages, 'index.astro'), subAstro);
                subtopicItems.push({ title, href: `/${sectionName}/${topicName}/${subName}` });
              }
            }
            processedItems.add(itemName);
          }
        }
      }
      
      // Process remaining items alphabetically (only if no metadata.json exists)
      const remainingItems = metadata ? [] : Array.from(allItems.entries())
        .filter(([name]) => !processedItems.has(name))
        .sort(([a], [b]) => a.localeCompare(b));
      
      for (const [itemName, item] of remainingItems) {
        if (item.type === 'tex') {
          // Process .tex file
          const { file, base } = item;
          const texPath = path.join(topicLatex, file);
          const subPages = topicPages;
          const outputHtml = path.join(topicContentDir, `${base}.html`);
          console.log(`Generating HTML for ${texPath} → ${outputHtml}`);
          execSync(
            `pandoc "${texPath}" -s --katex --section-divs --lua-filter=latex/filter.lua --css=style.css -o "${outputHtml}"`,
            { stdio: 'inherit' }
          );
          let html = await fs.readFile(outputHtml, 'utf-8');
          html = html.replace(/(<img[^>]*src=")(?!\/)([^"]+)(")/g,
            `$1/${sectionName}/${topicName}/$2$3`
          );
          await fs.writeFile(outputHtml, html);
          
          const title = humanize(base);
          const rawSectionTitle = sectionName === 'cs'
            ? 'Computer Science Notes'
            : `${capitalize(sectionName)} Notes`;
        const subAstro = `---
import NoteLayout from '../../../layouts/NoteLayout.astro';
import content from '../../../content/${sectionName}/${topicName}/${base}.html?raw';

const sectionName = '${sectionName}';
const sectionTitle = '${rawSectionTitle}';
const topicName = '${topicName}';
const topicTitle = '${humanize(topicName)}';
const title = '${title}';
const sidebarItems = [];
---

<NoteLayout sectionName={sectionName} sectionTitle={sectionTitle} topicName={topicName} topicTitle={topicTitle} title={title} sidebarItems={sidebarItems}>
  <div class="latex-notes" set:html={content} />
</NoteLayout>
`;
          await fs.writeFile(path.join(subPages, `${base}.astro`), subAstro);
          subtopicItems.push({ title, href: `/${sectionName}/${topicName}/${base}` });
        } else if (item.type === 'dir') {
          // Process subdirectory
          const { subDir, subName } = item;
          const subLatex = path.join(topicLatex, subName);
          const subPages = path.join(topicPages, subName);
          await fs.mkdir(subPages, { recursive: true });
          
          const subEntries = await fs.readdir(subLatex, { withFileTypes: true });
          await fs.mkdir(path.join(publicTopicDir, subName), { recursive: true });
          for (const entry of subEntries) {
            if (entry.isFile() && isImageFile(entry.name)) {
              const srcFile = path.join(subLatex, entry.name);
              await fs.copyFile(srcFile, path.join(publicTopicDir, subName, entry.name));
            }
          }
          
          const subTexFileEntries = await getOrderedFiles(subLatex, e => e.isFile() && e.name.endsWith('.tex'));
          const subTexFiles = subTexFileEntries.map(e => e.name);
          for (const file of subTexFiles) {
            const base = path.parse(file).name;
            const texPath = path.join(subLatex, file);
            const outputHtml = path.join(subPages, 'content.html');
            console.log(`Generating HTML for ${texPath} → ${outputHtml}`);
            execSync(
              `pandoc "${texPath}" -s --katex --section-divs --lua-filter=latex/filter.lua --css=style.css -o "${outputHtml}"`,
              { stdio: 'inherit' }
            );
            let html = await fs.readFile(outputHtml, 'utf-8');
            html = html.replace(/(<img[^>]*src=")(?!\/)([^"]+)(")/g,
              `$1/${sectionName}/${topicName}/${subName}/$2$3`
            );
            await fs.writeFile(outputHtml, html);
            
            const title = humanize(base);
            const rawSectionTitle = sectionName === 'cs'
              ? 'Computer Science Notes'
              : `${capitalize(sectionName)} Notes`;
            const subAstro = `---
import NoteLayout from '../../../../layouts/NoteLayout.astro';
import content from './content.html?raw';

const sectionName = '${sectionName}';
const sectionTitle = '${rawSectionTitle}';
const topicName = '${topicName}';
const topicTitle = '${humanize(topicName)}';
const title = '${title}';
const sidebarItems = [];
---

<NoteLayout sectionName={sectionName} sectionTitle={sectionTitle} topicName={topicName} topicTitle={topicTitle} title={title} sidebarItems={sidebarItems}>
  <div class="latex-notes" set:html={content} />
</NoteLayout>
`;
            await fs.writeFile(path.join(subPages, 'index.astro'), subAstro);
            subtopicItems.push({ title, href: `/${sectionName}/${topicName}/${subName}` });
          }
        }
      }
      // Only create topic index and add to section if there are subtopics to show
      if (subtopicItems.length > 0) {
        // Create topic index listing its subtopics
        const links = subtopicItems
          .map(item => `      <li><a href="${item.href}" class="subtopic-link">${item.title}</a></li>`)
          .join('\n');
        const rawSectionTitle = sectionName === 'cs'
          ? 'Computer Science Notes'
          : `${capitalize(sectionName)} Notes`;
        const topicIndex = `---
import BaseLayout from '../../../layouts/BaseLayout.astro';
---

<BaseLayout title="${humanize(topicName)}">
  <nav class="breadcrumbs">
    <a href="/${sectionName}">${rawSectionTitle}</a>
    <span class="divider">/</span>
    <span aria-current="page">${humanize(topicName)}</span>
  </nav>
  <div class="container">
    <h1>${humanize(topicName)}</h1>
    <div class="subtopic-list">
      <ul>
${links}
      </ul>
    </div>
  </div>
</BaseLayout>
`;
        await fs.writeFile(path.join(topicPages, 'index.astro'), topicIndex);
        indexItems.push({ title: humanize(topicName), href: `/${sectionName}/${topicName}` });
      }
    }

    // Generate section index.astro
    const links = indexItems
      .map(item => `      <a href="${item.href}" class="topic-card">
        <h2>${item.title}</h2>
      </a>`)
      .join('\n');
    const sectionTitle = sectionName === 'cs'
      ? 'Computer Science Notes'
      : `${capitalize(sectionName)} Notes`;
    // Check for description.md in section directory
    const descriptionMdPath = path.join(sectionLatex, 'description.md');
    let hasDescription = false;
    if (await fs.access(descriptionMdPath).then(() => true).catch(() => false)) {
      hasDescription = true;
      const descriptionHtmlPath = path.join(sectionPages, 'description.html');
      console.log(`Generating HTML for ${descriptionMdPath} → ${descriptionHtmlPath}`);
      execSync(
        `pandoc "${descriptionMdPath}" -s --katex --section-divs --lua-filter=latex/filter.lua --css=style.css -o "${descriptionHtmlPath}"`,
        { stdio: 'inherit' }
      );
    }
    const sectionIndex = `---
import BaseLayout from '../../layouts/BaseLayout.astro';
${hasDescription ? "import description from './description.html?raw';" : ''}
---

<BaseLayout title="${sectionTitle}">
  <div class="container">
    <h1>${sectionTitle}</h1>
${hasDescription ? '    <div class="section-description" set:html={description} />' : ''}
    <div class="topic-grid">
${links}
    </div>
  </div>
</BaseLayout>
`;
    await fs.writeFile(path.join(sectionPages, 'index.astro'), sectionIndex);
  }
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
