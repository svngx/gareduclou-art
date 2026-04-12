// ── Remark-Plugin: Schichten-Blöcke ──
// Erkennt :::kern, :::annotation, :::werkstatt, :::quellen
// und wandelt sie in <section data-schicht="kern"> etc.

const SCHICHTEN = ['kern', 'annotation', 'werkstatt', 'quellen'];
const OPEN_RE = /^:::(\w+)\s*$/;
const CLOSE_RE = /^:::\s*$/;

export default function remarkSchichten() {
  return (tree) => {
    const newChildren = [];
    let buffer = [];
    let currentSchicht = null;

    for (const node of tree.children) {
      // Prüfe ob dieser Knoten ein :::schicht Öffner oder ::: Schließer ist
      const text = getPlainText(node);

      if (!currentSchicht) {
        // Außerhalb eines Blocks — suche Öffner
        const match = text.match(OPEN_RE);
        if (match && SCHICHTEN.includes(match[1])) {
          currentSchicht = match[1];
          buffer = [];
        } else {
          newChildren.push(node);
        }
      } else {
        // Innerhalb eines Blocks — suche Schließer
        if (CLOSE_RE.test(text) && text.trim() === ':::') {
          // Block abschließen → HTML-Wrapper
          newChildren.push({
            type: 'html',
            value: `<section data-schicht="${currentSchicht}" class="schicht schicht--${currentSchicht}">`,
          });
          newChildren.push(...buffer);
          newChildren.push({
            type: 'html',
            value: '</section>',
          });
          currentSchicht = null;
          buffer = [];
        } else {
          buffer.push(node);
        }
      }
    }

    // Falls ein Block nicht geschlossen wurde — Inhalt trotzdem ausgeben
    if (currentSchicht && buffer.length) {
      newChildren.push({
        type: 'html',
        value: `<section data-schicht="${currentSchicht}" class="schicht schicht--${currentSchicht}">`,
      });
      newChildren.push(...buffer);
      newChildren.push({
        type: 'html',
        value: '</section>',
      });
    }

    tree.children = newChildren;
  };
}

function getPlainText(node) {
  if (node.type === 'paragraph' && node.children) {
    return node.children.map(c => c.value || '').join('').trim();
  }
  if (node.type === 'text') return (node.value || '').trim();
  return '';
}
