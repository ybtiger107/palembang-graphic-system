// Minimal dependency-free XML element parser, scoped to what the Palembang
// test suite needs: well-formed output from renderSvg() with no CDATA,
// comments, or namespace prefixes. Not a general-purpose XML parser.

class Element {
  constructor(tag, attributes) {
    this.tag = tag;
    this.attributes = attributes;
    this.children = [];
  }

  /** Recursively collect descendant elements matching one or more tag names. */
  findAll(tagNames) {
    const wanted = new Set(Array.isArray(tagNames) ? tagNames : [tagNames]);
    const out = [];
    const visit = (node) => {
      for (const child of node.children) {
        if (wanted.has(child.tag)) out.push(child);
        visit(child);
      }
    };
    visit(this);
    return out;
  }
}

const TAG_RE = /<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>|<\/([a-zA-Z][\w:-]*)\s*>/g;
const ATTR_RE = /([\w:-]+)="([^"]*)"/g;

function parseAttributes(raw) {
  const attributes = {};
  let match;
  ATTR_RE.lastIndex = 0;
  while ((match = ATTR_RE.exec(raw)) !== null) {
    attributes[match[1]] = match[2];
  }
  return attributes;
}

export class DOMParser {
  parseFromString(text) {
    const withoutDeclaration = text.replace(/^<\?xml[^>]*\?>\s*/, "");
    const stack = [];
    let root = null;
    let match;
    TAG_RE.lastIndex = 0;
    while ((match = TAG_RE.exec(withoutDeclaration)) !== null) {
      const [, openTag, attrText, selfClose, closeTag] = match;
      if (closeTag) {
        stack.pop();
        continue;
      }
      const element = new Element(openTag, parseAttributes(attrText || ""));
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(element);
      } else {
        root = element;
      }
      if (!selfClose) {
        stack.push(element);
      }
    }
    if (!root) {
      throw new Error("no root element found");
    }
    return root;
  }
}
