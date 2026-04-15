// 修复 content.js 中 updateFormBtn 的括号闭合问题
// 正确结构: addEventListener("click", ()=>{ $e(..., u=>{ ... L(`...`) }) }),
// 需要: ) } ) } ) ,  即 L 的 )  u=>的 }  $e的 )  ()=>的 }  addEventListener的 ) 逗号

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'content.js');
let content = fs.readFileSync(filePath, 'utf8');

// 唯一的 updateFormBtn 结尾: "请检查后手动保存。" 后应有 })}) 闭合
// 如果当前是 })}), 可能缺一个 } 或顺序错误
// syncBtn 正确结尾: L(`...`)})  所以是 })  })  - 两个 })
// updateFormBtn 也应如此

// 当前: ) } ) \n } ) } ) ,  多了一个 })
// 正确: ) } ) } ) ,  即 })\n})), 
const needle = '请检查后手动保存。`)})\n})}),';
const replacement = '请检查后手动保存。`)})\n})),';

if (content.includes(needle)) {
  content = content.replace(needle, replacement);
  fs.writeFileSync(filePath, content);
  console.log('已修复');
} else {
  const idx = content.indexOf('请检查后手动保存');
  if (idx >= 0) {
    console.log('找到位置:', idx);
    console.log('上下文:', JSON.stringify(content.substring(idx, idx + 80)));
  }
  console.log('未能自动修复');
}
