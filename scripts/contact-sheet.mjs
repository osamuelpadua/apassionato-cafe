import sharp from 'sharp'; import fs from 'node:fs'; import path from 'node:path';
const [dir, out, cols=6, size=260] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter(f=>/\.(png|jpe?g|webp)$/i.test(f)).sort();
const C=+cols,S=+size,rows=Math.ceil(files.length/C);
const comps=[];
for (const [i,f] of files.entries()){
  const img=await sharp(path.join(dir,f)).resize(S,S,{fit:'contain',background:'#ddd'}).flatten({background:'#ddd'}).toBuffer();
  const label=Buffer.from(`<svg width="${S}" height="22"><rect width="100%" height="100%" fill="#000"/><text x="4" y="15" font-size="12" fill="#fff" font-family="Arial">${f}</text></svg>`);
  comps.push({input:img,left:(i%C)*S,top:Math.floor(i/C)*(S+22)},{input:label,left:(i%C)*S,top:Math.floor(i/C)*(S+22)+S});
}
await sharp({create:{width:C*S,height:rows*(S+22),channels:3,background:'#fff'}}).composite(comps).jpeg({quality:80}).toFile(out);
console.log(files.length,'->',out);
