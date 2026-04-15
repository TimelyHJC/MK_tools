const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'content.js');
let content = fs.readFileSync(filePath, 'utf8');

// 将 ?? 替换为兼容写法 (a ?? b) -> (a!=null?a:b)
// 从内到外处理，先处理简单的模式
function findMatchingParen(s, start, dir) {
  let depth = 0;
  const open = dir > 0 ? '(' : ')';
  const close = dir > 0 ? ')' : '(';
  for (let i = start; i >= 0 && i < s.length; i += dir) {
    const c = s[i];
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return i; }
  }
  return -1;
}

let count = 0;
while (content.includes('??')) {
  const idx = content.indexOf('??');
  if (idx < 0) break;
  
  // 向左找左操作数起点
  let leftEnd = idx - 1;
  let leftStart = leftEnd;
  let depth = 0;
  for (let i = leftEnd; i >= 0; i--) {
    const c = content[i];
    if (c === ')') depth++;
    else if (c === '(') { depth--; if (depth === 0) { leftStart = i; break; } }
    else if (c === ']') depth++;
    else if (c === '[') { depth--; if (depth === 0) { leftStart = i; break; } }
    else if (c === '}') depth++;
    else if (c === '{') { depth--; if (depth === 0) { leftStart = i; break; } }
    else if (depth === 0 && /[;,=?:&|([{\s]/.test(c)) { leftStart = i + 1; break; }
    else if (i === 0) { leftStart = 0; break; }
  }
  
  // 向右找右操作数终点
  let rightStart = idx + 2;
  let rightEnd = rightStart;
  depth = 0;
  for (let i = rightStart; i < content.length; i++) {
    const c = content[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') { depth--; if (depth < 0) { rightEnd = i; break; } }
    else if (depth === 0 && /[;,)?:&|}\]]/.test(c)) { rightEnd = i; break; }
    rightEnd = i + 1;
  }
  
  const left = content.substring(leftStart, idx);
  const right = content.substring(idx + 2, rightEnd);
  const replacement = `(${left}!=null?${left}:${right})`;
  content = content.substring(0, leftStart) + replacement + content.substring(rightEnd);
  count++;
  if (count > 500) break; // 防止无限循环
}

fs.writeFileSync(filePath, content);
console.log('Replaced', count, '?? operators');
