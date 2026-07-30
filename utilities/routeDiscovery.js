import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { seleniumConfig } from '../config/selenium.config.js';
import { protectedRoutes, publicRoutes } from '../data/selenium/testData.js';

function findPageFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const nextPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) return findPageFiles(nextPath);
    return entry.isFile() && entry.name === 'page.tsx' ? [nextPath] : [];
  });
}

function routeFromFile(filePath) {
  const relative = path.relative(seleniumConfig.webAppDir, filePath).replace(/\\/g, '/');
  const withoutPage = relative.replace(/\/?page\.tsx$/, '');
  const route = withoutPage ? `/${withoutPage}` : '/';
  return route;
}

function samplePathFor(routeTemplate) {
  if (routeTemplate === '/facts/[factId]') return '/facts/blood-needs';
  return routeTemplate.replace(/\[([^\]]+)\]/g, 'sample-$1');
}

function attrValue(attr, sourceFile) {
  if (!ts.isJsxAttribute(attr) || !attr.initializer) return attr.name?.getText(sourceFile) || '';
  if (ts.isStringLiteral(attr.initializer)) return attr.initializer.text;
  if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
    const expression = attr.initializer.expression;
    if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return expression.text;
    if (expression.kind === ts.SyntaxKind.TrueKeyword) return 'true';
    if (expression.kind === ts.SyntaxKind.FalseKeyword) return 'false';
    return expression.getText(sourceFile);
  }
  return attr.initializer.getText(sourceFile);
}

function attrsFor(node, sourceFile) {
  const output = {};
  const props = node.attributes?.properties || [];
  props.forEach((attr) => {
    if (ts.isJsxAttribute(attr)) output[attr.name.getText(sourceFile)] = attrValue(attr, sourceFile);
  });
  return output;
}

function jsxText(children) {
  return children
    .map((child) => {
      if (ts.isJsxText(child)) return child.getText().replace(/\s+/g, ' ').trim();
      if (ts.isJsxExpression(child) && child.expression) return '';
      if (ts.isJsxElement(child)) return jsxText(child.children);
      return '';
    })
    .filter(Boolean)
    .join(' ')
    .trim();
}

function pushElement(meta, tag, attrs, text) {
  const element = { attrs, tag, text };
  if (tag === 'Input' || tag === 'input') meta.inputs.push(element);
  if (tag === 'Select' || tag === 'select') meta.selects.push(element);
  if (tag === 'Textarea' || tag === 'textarea') meta.textareas.push(element);
  if (tag === 'Checkbox') meta.checkboxes.push(element);
  if (tag === 'Button' || tag === 'button') meta.buttons.push(element);
  if (tag === 'Link' || tag === 'a') meta.links.push(element);
  if (tag === 'Notice') meta.notices.push(element);
  if (tag === 'PageHeader') meta.pageHeaders.push(element);
  if (tag === 'form') meta.forms.push(element);
}

function validationMessages(source) {
  const messages = new Set();
  const patterns = [
    /set(?:Error|Message)\('([^']+)'\)/g,
    /throw new Error\('([^']+)'\)/g,
  ];
  patterns.forEach((pattern) => {
    let match = pattern.exec(source);
    while (match) {
      messages.add(match[1]);
      match = pattern.exec(source);
    }
  });
  return Array.from(messages);
}

export function analyzePageFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const meta = {
    buttons: [],
    checkboxes: [],
    forms: [],
    inputs: [],
    links: [],
    notices: [],
    pageHeaders: [],
    selects: [],
    textareas: [],
    validationMessages: validationMessages(source),
  };

  function visit(node) {
    if (ts.isJsxElement(node)) {
      const tag = node.openingElement.tagName.getText(sourceFile);
      pushElement(meta, tag, attrsFor(node.openingElement, sourceFile), jsxText(node.children));
    }

    if (ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sourceFile);
      pushElement(meta, tag, attrsFor(node, sourceFile), '');
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return meta;
}

export function discoverReactRoutes() {
  return findPageFiles(seleniumConfig.webAppDir)
    .map((filePath) => {
      const routeTemplate = routeFromFile(filePath);
      const samplePath = samplePathFor(routeTemplate);
      return {
        dynamic: routeTemplate.includes('['),
        filePath,
        meta: analyzePageFile(filePath),
        protected: protectedRoutes.includes(samplePath) || samplePath.startsWith('/profile') || samplePath.startsWith('/facts') || samplePath === '/search' || samplePath === '/results',
        public: publicRoutes.includes(samplePath),
        samplePath,
        template: routeTemplate,
      };
    })
    .sort((left, right) => left.samplePath.localeCompare(right.samplePath));
}
