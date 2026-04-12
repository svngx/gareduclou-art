// ── Remark-Plugin: Schichten-Blöcke ──
// Erkennt :::kern, :::annotation, :::werkstatt, :::quellen
// Robust: funktioniert auch wenn :::marker und Text im selben Absatz landen.

const SCHICHTEN = ['kern', 'annotation', 'werkstatt', 'quellen'];
const OPEN_RE = /^:::(\w+)\s*/;
const CLOSE_RE = /\s*:::\s*$/;

export default function remarkSchichten() {
  return (tree) => {
    const newChildren = [];
    let buffer = [];
    let currentSchicht = null;

    for (const node of tree.children) {
      const text = getPlainText(node);

      if (!currentSchicht) {
        // Suche Öffner
        const match = text.match(OPEN_RE);
        if (match && SCHICHTEN.includes(match[1])) {
          currentSchicht = match[1];
          buffer = [];

          // Prüfe: Schließer im selben Absatz? (:::kern Text :::)
          if (CLOSE_RE.test(text)) {
            const inner = text.slice(match[0].length).replace(/\s*:::\s*$/, '').trim();
            if (inner) {
              newChildren.push({
                type: 'html',
                value: `<section data-schicht="${currentSchicht}" class="schicht schicht--${currentSchicht}">`,
              });
              newChildren.push(makeParagraph(inner));
              newChildren.push({ type: 'html', value: '</section>' });
            }
            currentSchicht = null;
            continue;
          }

          // Rest des Absatzes nach :::marker als Inhalt behalten
          const rest = text.slice(match[0].length).trim();
          if (rest) {
            buffer.push(makeParagraph(rest));
          }
        } else {
          newChildren.push(node);
        }
      } else {
        // Innerhalb eines Blocks
        const closeMatch = text.match(CLOSE_RE);
        const isOnlyClose = text.trim() === ':::';

        if (isOnlyClose) {
          // Reiner Schließer → Block abschließen
          flush(newChildren, currentSchicht, buffer);
          currentSchicht = null;
          buffer = [];
        } else if (closeMatch) {
          // Schließer am Ende eines Absatzes mit Text davor
          const before = text.replace(CLOSE_RE, '').trim();
          if (before) buffer.push(makeParagraph(before));
          flush(newChildren, currentSchicht, buffer);
          currentSchicht = null;
          buffer = [];
        } else {
          buffer.push(node);
        }
      }
    }

    // Ungeschlossener Block → trotzdem ausgeben
    if (currentSchicht && buffer.length) {
      flush(newChildren, currentSchicht, buffer);
    }

    tree.children = newChildren;
  };
}

function flush(target, schicht, buffer) {
  target.push({
    type: 'html',
    value: `<section data-schicht="${schicht}" class="schicht schicht--${schicht}">`,
  });
  target.push(...buffer);
  target.push({ type: 'html', value: '</section>' });
}

function makeParagraph(text) {
  return {
    type: 'paragraph',
    children: [{ type: 'text', value: text }],
  };
}

function getPlainText(node) {
  if (node.type === 'paragraph' && node.children) {
    return node.children.map(c => c.value || '').join('').trim();
  }
  if (node.type === 'text') return (node.value || '').trim();
  return '';
}
