export default function PointerPicture({values,left,right}:{values:readonly number[];left:number;right:number}) {
 const spacing=540/Math.max(1,values.length-1),water=Math.min(values[left],values[right])*9
 return <figure className="pointer-picture"><figcaption>The shorter wall limits how much water fits.</figcaption><svg viewBox="0 0 600 150" role="img" aria-label={`Walls ${left+1} and ${right+1} hold water up to height ${Math.min(values[left],values[right])}`}>
 <g key={`${left}-${right}`} className="water-change"><rect x={30+left*spacing} y={120-water} width={(right-left)*spacing} height={water} fill="#cee4df"/><path d={`M ${30+left*spacing} ${120-water} H ${30+right*spacing}`} stroke="#6d9f93" strokeDasharray="4 4"/></g>
 {values.map((n,i)=><g key={i}><rect x={24+i*spacing} y={120-n*9} width="12" height={n*9} rx="2" fill={i===left||i===right?'#315b49':'#c9cebd'}/><text x={30+i*spacing} y="141" textAnchor="middle" fontSize="12" fill="#4b5843">{n}</text></g>)}
 </svg><p>This pair holds: width {right-left} × shorter height {Math.min(values[left],values[right])} = <strong>{(right-left)*Math.min(values[left],values[right])}</strong>.</p></figure>
}
